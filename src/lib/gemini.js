// Gemini live-price fetcher with Google Search grounding.
// The API key is supplied by the user in the app (BYOK) and never leaves their browser.

const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Discover which models this key can actually use (model names change over time)
async function listModels(apiKey) {
  const res = await fetch(`${API_BASE}?key=${encodeURIComponent(apiKey)}`);
  if (!res.ok) throw new Error(`list (${res.status})`);
  const json = await res.json();
  return (json.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => String(m.name).replace(/^models\//, ''));
}

function pickModels(names) {
  const scored = names.map((n) => {
    const l = n.toLowerCase();
    let score = 0;
    if (l.includes('flash')) score += 10;
    if (/\bgemini-(\d+)/.test(l)) score += parseInt(l.match(/\bgemini-(\d+)/)[1], 10);
    if (l.includes('latest')) score += 3;
    if (l.includes('pro')) score += 2;
    if (/exp|preview/.test(l)) score -= 5;
    return { n, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.n);
}

function buildPrompt({ originName, destName, country, international }) {
  const route = international
    ? `${originName} to ${destName}, ${country}`
    : `${originName} to ${destName}, Bangladesh`;
  return (
    `You are a travel fare researcher. Use Google Search to find CURRENT round-trip fares per person for: ${route}.\n` +
    `Find fares for each mode that actually exists on this route: intercity AC bus, train (only if rail service exists), flight (only if flights exist). Omit modes with no service.\n` +
    `Also find: average mid-range hotel price per night in ${destName}, and average food cost per day per person in ${destName}.\n` +
    `Use BDT for fares within Bangladesh, USD for international flights and hotels.\n` +
    `Return ONLY raw JSON, no markdown fences, no commentary, exactly this shape:\n` +
    `{"transport":[{"mode":"bus","fare":2500,"currency":"BDT","detail":"Green Line AC, round trip"}],"hotel_per_night":{"amount":5500,"currency":"BDT"},"food_per_day":{"amount":1200,"currency":"BDT"},"sources":["https://..."]}\n` +
    `"mode" must be one of bus, train, flight. Fares must be ROUND TRIP per person, based on what you actually find via search. Include 2-4 source URLs you used.`
  );
}

function parseJson(text) {
  const clean = String(text || '').replace(/```(?:json)?/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI returned no JSON.');
  return JSON.parse(clean.slice(start, end + 1));
}

const VALID_MODES = ['bus', 'train', 'flight'];

async function callGemini(model, apiKey, body) {
  return fetch(`${API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function getLivePrices({ apiKey, originName, destName, country, international }) {
  if (!apiKey) throw new Error('API key missing.');

  const body = {
    contents: [{ parts: [{ text: buildPrompt({ originName, destName, country, international }) }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  };

  let lastError = new Error('Gemini API error.');
  let retried = false;

  // Prefer models this key can actually call; fall back to known names
  let models;
  try {
    const discovered = await listModels(apiKey);
    models = pickModels(discovered).slice(0, 3);
  } catch {
    models = [];
  }
  if (!models.length) models = [...FALLBACK_MODELS];

  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let res;
      try {
        res = await callGemini(model, apiKey, body);
      } catch {
        lastError = new Error('Network error — check your internet connection.');
        retried = true;
        await sleep(2000 * (attempt + 1));
        continue;
      }

      if (res.ok) {
        const json = await res.json();
        const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
        if (!text) {
          lastError = new Error('AI returned an empty response. Try again.');
          break;
        }
        try {
          const data = parseJson(text);
          return finalize(data);
        } catch (e) {
          if (/no fares/i.test(e.message)) throw e;
          lastError = new Error('AI response was not valid. Try again.');
          break;
        }
      }

      const t = await res.text().catch(() => '');
      if (res.status === 400 && /key|api_key/i.test(t)) {
        throw new Error('Invalid API key. Check it in Settings.');
      }
      if (res.status === 404) {
        lastError = new Error(`Model ${model} not available.`);
        break; // try next model
      }
      if ([429, 500, 502, 503].includes(res.status)) {
        retried = true;
        lastError = new Error(
          `Gemini is overloaded right now (${res.status}). Please wait a minute and retry.`
        );
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw new Error(`Gemini API error (${res.status}).`);
    }
  }

  if (retried) {
    lastError.message += ' Tried twice — Google\'s servers may be busy; retry shortly.';
  }
  throw lastError;
}

function finalize(data) {
  const transport = (Array.isArray(data.transport) ? data.transport : [])
    .filter((t) => t && VALID_MODES.includes(t.mode) && Number.isFinite(Number(t.fare)) && Number(t.fare) > 0)
    .map((t) => ({
      mode: t.mode,
      fare: Number(t.fare),
      currency: t.currency === 'USD' ? 'USD' : 'BDT',
      detail: String(t.detail || '').slice(0, 120),
    }));
  if (!transport.length) throw new Error('AI found no fares for this route. Try again.');

  const money = (m) =>
    m && Number.isFinite(Number(m.amount)) && Number(m.amount) > 0
      ? { amount: Number(m.amount), currency: m.currency === 'USD' ? 'USD' : 'BDT' }
      : null;

  return {
    transport,
    hotel_per_night: money(data.hotel_per_night),
    food_per_day: money(data.food_per_day),
    sources: (Array.isArray(data.sources) ? data.sources : []).filter((u) => typeof u === 'string').slice(0, 4),
  };
}
