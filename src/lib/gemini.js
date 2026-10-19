// Gemini live-price fetcher with Google Search grounding.
// The API key is supplied by the user in the app (BYOK) and never leaves their browser.

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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

export async function getLivePrices({ apiKey, originName, destName, country, international }) {
  if (!apiKey) throw new Error('API key missing.');

  const body = {
    contents: [{ parts: [{ text: buildPrompt({ originName, destName, country, international }) }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  };

  let res;
  try {
    res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error — check your internet connection.');
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    if (res.status === 400 && /key/i.test(t)) throw new Error('Invalid API key. Check it in Settings.');
    if (res.status === 429) throw new Error('Rate limit hit — wait a minute and retry.');
    throw new Error(`Gemini API error (${res.status}).`);
  }

  const json = await res.json();
  const text = (json.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  if (!text) throw new Error('AI returned an empty response. Try again.');

  const data = parseJson(text);
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
