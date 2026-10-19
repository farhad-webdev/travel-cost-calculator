import { useEffect, useMemo, useState } from 'react';
import TripMap from './components/TripMap.jsx';
import { getLivePrices } from './lib/gemini.js';
import {
  DESTINATIONS,
  STYLE_MULTIPLIERS,
  STYLE_LABELS,
  DEFAULT_FX,
  FX_API,
  ORIGINS,
  ROUTE_FARES,
  FALLBACK_FARE,
} from './data/destinations.js';

const uid = () => Math.random().toString(36).slice(2, 10);
const round2 = (n) => Math.round(n * 100) / 100;
const num = (v, fb = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : fb;
};
const todayPlus = (d) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString().slice(0, 10);
};

function suggestedCosts(dest, style) {
  const m = STYLE_MULTIPLIERS[style] || 1;
  return {
    hotel: round2(dest.hotel * m),
    food: round2(dest.food * m),
    transport: round2(dest.transport * m),
    activities: round2(dest.activities * m),
    visa: dest.visa || 0,
    flight: dest.flight || 0,
    bus: dest.land ? dest.land.bus : 0,
    train: dest.land ? dest.land.train : 0,
  };
}

const COST_FIELDS = [
  { key: 'hotel', label: 'Hotel (per room / night)' },
  { key: 'food', label: 'Food (per person / day)' },
  { key: 'transport', label: 'Local transport (per day)' },
  { key: 'activities', label: 'Activities (per person / day)' },
];

export default function App() {
  const [tripName, setTripName] = useState('');
  const [mode, setMode] = useState('domestic');
  const [destinationId, setDestinationId] = useState(DESTINATIONS.find((d) => d.type === 'domestic').id);
  const [originId, setOriginId] = useState('dhaka');
  const [startDate, setStartDate] = useState(todayPlus(30));
  const [endDate, setEndDate] = useState(todayPlus(33));
  const [travelers, setTravelers] = useState(2);
  const [style, setStyle] = useState('mid');
  const [displayCurrency, setDisplayCurrency] = useState('BDT');
  const [fx, setFx] = useState(DEFAULT_FX);
  const [fxLive, setFxLive] = useState(false);
  const [costs, setCosts] = useState(() =>
    suggestedCosts(DESTINATIONS.find((d) => d.type === 'domestic'), 'mid')
  );
  const [unitOv, setUnitOv] = useState({});
  const [qtyOv, setQtyOv] = useState({});
  const [appliesOv, setAppliesOv] = useState({});
  const [customRows, setCustomRows] = useState([]);
  const [newCustom, setNewCustom] = useState({ name: '', unit: '', qty: 1, appliesTo: 'group' });
  const [contingency, setContingency] = useState(10);
  const [getThereMode, setGetThereMode] = useState('bus'); // 'flight' | 'bus' | 'train'
  // Gemini live prices (BYOK — key lives in this browser only)
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem('tcc-gemini-key') || ''; } catch { return ''; }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiFares, setAiFares] = useState(null); // { bus: {fare, currency, detail}, ... }
  const [savedTrips, setSavedTrips] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tcc-trips-v1') || '[]');
    } catch {
      return [];
    }
  });

  const dest = DESTINATIONS.find((d) => d.id === destinationId) || DESTINATIONS[0];
  const destCurrency = dest.currency;
  const origin = ORIGINS.find((o) => o.id === originId) || ORIGINS[0];

  // Live USD -> BDT rate
  useEffect(() => {
    fetch(FX_API)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.rates && d.rates.BDT) {
          setFx(round2(d.rates.BDT));
          setFxLive(true);
        }
      })
      .catch(() => {});
  }, []);

  // Persist saved trips
  useEffect(() => {
    try {
      localStorage.setItem('tcc-trips-v1', JSON.stringify(savedTrips));
    } catch {}
  }, [savedTrips]);

  // Persist Gemini key in this browser only
  useEffect(() => {
    try { localStorage.setItem('tcc-gemini-key', apiKey); } catch {}
  }, [apiKey]);

  const resetAi = () => {
    setAiFares(null);
    setAiResult(null);
    setAiError('');
  };

  const switchMode = (m) => {
    setMode(m);
    const first = DESTINATIONS.find((d) => d.type === m);
    setDestinationId(first.id);
    setCosts(suggestedCosts(first, style));
    setGetThereMode(first.type === 'international' ? 'flight' : 'bus');
    resetAi();
    setUnitOv({});
    setQtyOv({});
    setAppliesOv({});
  };

  const changeDestination = (id) => {
    const d = DESTINATIONS.find((x) => x.id === id);
    setDestinationId(id);
    setCosts(suggestedCosts(d, style));
    setGetThereMode(d.type === 'international' ? 'flight' : 'bus');
    resetAi();
    setUnitOv({});
    setQtyOv({});
    setAppliesOv({});
  };

  const changeStyle = (s) => {
    setStyle(s);
    setCosts(suggestedCosts(dest, s));
    setUnitOv({});
    setQtyOv({});
    setAppliesOv({});
  };

  const changeOrigin = (id) => {
    setOriginId(id);
    resetAi();
    setUnitOv((p) => {
      const n = { ...p };
      delete n.getthere;
      return n;
    });
  };

  const fetchLivePrices = async () => {
    if (!apiKey.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const data = await getLivePrices({
        apiKey: apiKey.trim(),
        originName: origin.name,
        destName: dest.name,
        country: dest.country,
        international: dest.type === 'international',
      });
      setAiResult({ ...data, at: new Date().toLocaleString() });
    } catch (e) {
      setAiError(e.message || 'Failed to fetch live prices.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiTransport = (t) => {
    setAiFares((p) => ({ ...(p || {}), [t.mode]: t }));
    setGetThereMode(t.mode);
    setUnitOv((p) => {
      const n = { ...p };
      delete n.getthere;
      return n;
    });
  };

  const applyAiMoney = (field, m) => {
    if (!m) return;
    const inDest = m.currency === destCurrency ? m.amount : destCurrency === 'BDT' ? m.amount * fx : m.amount / fx;
    setCosts((p) => ({ ...p, [field]: round2(inDest) }));
  };

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const ms = new Date(endDate) - new Date(startDate);
    return Math.max(0, Math.round(ms / 86400000));
  }, [startDate, endDate]);
  const days = nights + 1;
  const rooms = Math.max(1, Math.ceil(num(travelers, 1) / 2));

  const autoRows = useMemo(() => {
    const base = [
      { id: 'hotel', name: 'Hotel / Accommodation', unit: costs.hotel, qty: nights * rooms, appliesTo: 'group', note: `${nights} night(s) × ${rooms} room(s)` },
      { id: 'food', name: 'Food & Meals', unit: costs.food, qty: days, appliesTo: 'person', note: `${days} day(s)` },
      { id: 'transport', name: 'Local Transport', unit: costs.transport, qty: days, appliesTo: 'group', note: `${days} day(s)` },
      { id: 'activities', name: 'Activities & Sightseeing', unit: costs.activities, qty: days, appliesTo: 'person', note: `${days} day(s)` },
    ];
    if (dest.type === 'international') {
      base.push({ id: 'visa', name: 'Visa Fee', unit: costs.visa, qty: 1, appliesTo: 'person', note: 'per person' });
    }
    // ---- Getting there: unified Flight / Bus / Train options ----
    const gtOpts = [];
    if (dest.type === 'international') {
      gtOpts.push({ mode: 'flight', fare: costs.flight, currency: 'USD', detail: 'Estimated round-trip fare' });
      if (dest.land) {
        if (costs.bus > 0) gtOpts.push({ mode: 'bus', fare: costs.bus, currency: 'BDT', detail: 'Estimated' });
        if (costs.train > 0) gtOpts.push({ mode: 'train', fare: costs.train, currency: 'BDT', detail: 'Estimated' });
      }
    } else {
      const fareKey = `${originId}>${dest.id}`;
      const baseFare = ROUTE_FARES[fareKey];
      gtOpts.push({
        mode: 'bus',
        fare: baseFare !== undefined ? baseFare : FALLBACK_FARE,
        currency: 'BDT',
        detail: baseFare !== undefined ? 'Researched baseline' : 'Estimate — verify',
      });
    }
    if (aiFares) {
      for (const m of ['bus', 'train', 'flight']) {
        if (aiFares[m]) {
          const entry = {
            mode: m,
            fare: aiFares[m].fare,
            currency: aiFares[m].currency,
            detail: aiFares[m].detail || 'Live via AI search',
          };
          const ix = gtOpts.findIndex((o) => o.mode === m);
          if (ix >= 0) gtOpts[ix] = entry;
          else gtOpts.push(entry);
        }
      }
    }
    const modeOrder = ['flight', 'bus', 'train'];
    gtOpts.sort((a, b) => modeOrder.indexOf(a.mode) - modeOrder.indexOf(b.mode));
    const selMode = gtOpts.some((o) => o.mode === getThereMode) ? getThereMode : gtOpts[0].mode;
    const sel = gtOpts.find((o) => o.mode === selMode);
    const toDestCur = (fare, cur) => {
      if (cur === destCurrency) return fare;
      return destCurrency === 'BDT' ? fare * fx : fare / fx;
    };
    const selSym = sel.currency === 'BDT' ? '৳' : '$';
    const cap = (s) => s[0].toUpperCase() + s.slice(1);
    base.unshift({
      id: 'getthere',
      name:
        dest.type === 'international'
          ? `Getting there (${origin.airport} round trip)`
          : `Travel to ${dest.name} (round trip)`,
      unit: round2(toDestCur(sel.fare, sel.currency)),
      qty: 1,
      appliesTo: 'person',
      note:
        (dest.type === 'domestic' ? `${origin.name} → ${dest.name} · ` : '') +
        `${cap(sel.mode)} · ${selSym}${Number(sel.fare).toLocaleString('en-US')}${sel.detail ? ` — ${sel.detail}` : ''}`,
      hasMode: gtOpts.length > 1,
      modes: gtOpts.map((o) => o.mode),
      selMode,
    });
    return base.map((r) => ({
      ...r,
      unit: unitOv[r.id] !== undefined ? unitOv[r.id] : r.unit,
      qty: qtyOv[r.id] !== undefined ? qtyOv[r.id] : r.qty,
      appliesTo: appliesOv[r.id] || r.appliesTo,
    }));
  }, [costs, nights, days, rooms, dest.type, dest.id, dest.name, originId, origin.name, origin.airport, getThereMode, fx, aiFares, unitOv, qtyOv, appliesOv]);

  const allRows = useMemo(
    () => [
      ...autoRows.map((r) => ({ ...r, custom: false })),
      ...customRows.map((r) => ({ ...r, custom: true, note: r.appliesTo === 'person' ? 'per person' : 'group total' })),
    ],
    [autoRows, customRows]
  );

  const tCount = Math.max(1, num(travelers, 1));
  const rowTotal = (r) => round2(r.unit * r.qty * (r.appliesTo === 'person' ? tCount : 1));

  const subtotal = round2(allRows.reduce((s, r) => s + rowTotal(r), 0));
  const contingencyAmt = round2((subtotal * num(contingency, 0)) / 100);
  const grandTotal = round2(subtotal + contingencyAmt);
  const perPerson = round2(grandTotal / tCount);

  const toDisplay = (amt) => {
    if (destCurrency === displayCurrency) return amt;
    return displayCurrency === 'BDT' ? amt * fx : amt / fx;
  };
  const fmt = (amt) => {
    const sym = displayCurrency === 'BDT' ? '৳' : '$';
    return `${sym} ${Number(toDisplay(amt)).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };
  const fmtDest = (amt) => {
    const sym = destCurrency === 'BDT' ? '৳' : '$';
    return `${sym} ${Number(amt).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const addCustomRow = () => {
    if (!newCustom.name.trim()) return;
    setCustomRows((p) => [
      ...p,
      {
        id: uid(),
        name: newCustom.name.trim(),
        unit: num(newCustom.unit, 0),
        qty: num(newCustom.qty, 1),
        appliesTo: newCustom.appliesTo,
      },
    ]);
    setNewCustom({ name: '', unit: '', qty: 1, appliesTo: 'group' });
  };

  const saveTrip = () => {
    const snapshot = {
      tripName, mode, destinationId, originId, getThereMode, startDate, endDate,
      travelers: tCount, style, displayCurrency, fx,
      costs, customRows, contingency, unitOv, qtyOv, appliesOv,
    };
    const entry = {
      id: uid(),
      name: tripName.trim() || `${dest.name} trip`,
      savedAt: new Date().toISOString(),
      snapshot,
    };
    setSavedTrips((p) => [entry, ...p]);
  };

  const loadTrip = (entry) => {
    const s = entry.snapshot;
    setTripName(s.tripName);
    setMode(s.mode);
    setDestinationId(s.destinationId);
    setOriginId(s.originId || 'dhaka');
    setGetThereMode(s.getThereMode || 'flight');
    setStartDate(s.startDate);
    setEndDate(s.endDate);
    setTravelers(s.travelers);
    setStyle(s.style);
    setDisplayCurrency(s.displayCurrency);
    setFx(s.fx);
    setCosts(s.costs);
    setCustomRows(s.customRows || []);
    setContingency(s.contingency);
    setUnitOv(s.unitOv || {});
    setQtyOv(s.qtyOv || {});
    setAppliesOv(s.appliesOv || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const flightUrl = `https://www.google.com/travel/flights?q=flights%20${origin.airport}%20to%20${dest.airport}`;
  const hotelUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(dest.bookingQuery)}`;

  const breakdown = allRows
    .map((r) => ({ name: r.name, total: rowTotal(r) }))
    .filter((b) => b.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="app">
      <header className="hero no-print">
        <div>
          <h1>Travel Cost Calculator</h1>
          <p>Destination-based trip budgets for Bangladesh &amp; beyond — group split, currency conversion, PDF export.</p>
        </div>
        <div className="hero-actions">
          <button className="btn ghost" onClick={saveTrip}>Save trip</button>
          <button className="btn primary" onClick={() => window.print()}>Print / PDF</button>
        </div>
      </header>

      <main className="grid">
        {/* ---------- Trip setup ---------- */}
        <section className="card">
          <h2>Trip setup</h2>
          <label className="field">
            <span>Trip name</span>
            <input value={tripName} onChange={(e) => setTripName(e.target.value)} placeholder={`${dest.name} getaway`} />
          </label>
          <div className="seg">
            {['domestic', 'international'].map((m) => (
              <button key={m} className={mode === m ? 'active' : ''} onClick={() => switchMode(m)}>
                {m === 'domestic' ? 'Domestic' : 'International'}
              </button>
            ))}
          </div>
          <div className="row2">
            <label className="field">
              <span>Destination</span>
              <select value={destinationId} onChange={(e) => changeDestination(e.target.value)}>
                {DESTINATIONS.filter((d) => d.type === mode).map((d) => (
                  <option key={d.id} value={d.id}>{d.name}{d.type === 'international' ? `, ${d.country}` : ''}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{mode === 'domestic' ? 'Starting from' : 'Flying from'}</span>
              <select value={originId} onChange={(e) => changeOrigin(e.target.value)}>
                {ORIGINS.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}{mode === 'international' ? ` (${o.airport})` : ''}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="row2">
            <label className="field">
              <span>Start date</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="field">
              <span>End date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <div className="row2">
            <label className="field">
              <span>Travelers</span>
              <input type="number" min="1" value={travelers} onChange={(e) => setTravelers(num(e.target.value, 1))} />
            </label>
            <label className="field">
              <span>Travel style</span>
              <select value={style} onChange={(e) => changeStyle(e.target.value)}>
                {Object.keys(STYLE_LABELS).map((s) => (
                  <option key={s} value={s}>{STYLE_LABELS[s]}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="hint">{nights} night(s) · {days} day(s) · {rooms} room(s) · {tCount} traveler(s)</p>

          <div className="fxbox">
            <div className="fxrow">
              <span>USD → BDT rate</span>
              <span className={fxLive ? 'pill live' : 'pill'}>{fxLive ? 'Live' : 'Default'}</span>
            </div>
            <input type="number" min="0" step="0.01" value={fx} onChange={(e) => { setFx(num(e.target.value, DEFAULT_FX)); setFxLive(false); }} />
            <div className="seg small">
              {['BDT', 'USD'].map((c) => (
                <button key={c} className={displayCurrency === c ? 'active' : ''} onClick={() => setDisplayCurrency(c)}>
                  Show in {c}
                </button>
              ))}
            </div>
          </div>

          <div className="aibox">
            <div className="fxrow">
              <span>Live prices (Gemini AI)</span>
              {aiResult && <span className="pill live">Live</span>}
            </div>
            <div className="ai-actions">
              <button className="btn primary sm" disabled={aiLoading || !apiKey.trim()} onClick={fetchLivePrices}>
                {aiLoading ? 'Searching live fares…' : 'Fetch live prices'}
              </button>
              <button className="btn ghost sm" onClick={() => setShowSettings((s) => !s)}>API key</button>
            </div>
            {!apiKey.trim() && (
              <p className="hint">Add your Gemini API key to fetch real-time fares via AI web search. The key stays in this browser only.</p>
            )}
            {showSettings && (
              <label className="field" style={{ marginTop: 10 }}>
                <span>Gemini API key (stored only in this browser)</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza…"
                  autoComplete="off"
                />
              </label>
            )}
            {aiError && <p className="err">{aiError}</p>}
            {aiResult && (
              <div className="aires">
                {(aiResult.transport || []).map((t, i) => (
                  <div className="airow" key={i}>
                    <div>
                      <strong className="cap">{t.mode}</strong>{' '}
                      {t.currency === 'BDT' ? '৳' : '$'}{Number(t.fare).toLocaleString('en-US')}
                      {t.detail && <div className="cellnote">{t.detail}</div>}
                    </div>
                    <button className="btn ghost sm" onClick={() => applyAiTransport(t)}>Use</button>
                  </div>
                ))}
                {aiResult.hotel_per_night && aiResult.hotel_per_night.amount > 0 && (
                  <div className="airow">
                    <div>
                      Hotel <strong>{aiResult.hotel_per_night.currency === 'BDT' ? '৳' : '$'}{Number(aiResult.hotel_per_night.amount).toLocaleString('en-US')}</strong> / night
                    </div>
                    <button className="btn ghost sm" onClick={() => applyAiMoney('hotel', aiResult.hotel_per_night)}>Apply</button>
                  </div>
                )}
                {aiResult.food_per_day && aiResult.food_per_day.amount > 0 && (
                  <div className="airow">
                    <div>
                      Food <strong>{aiResult.food_per_day.currency === 'BDT' ? '৳' : '$'}{Number(aiResult.food_per_day.amount).toLocaleString('en-US')}</strong> / day
                    </div>
                    <button className="btn ghost sm" onClick={() => applyAiMoney('food', aiResult.food_per_day)}>Apply</button>
                  </div>
                )}
                {(aiResult.sources || []).length > 0 && (
                  <div className="sources">
                    <span>Sources:</span>
                    {aiResult.sources.map((u, i) => (
                      <a key={i} href={u} target="_blank" rel="noreferrer">[{i + 1}]</a>
                    ))}
                  </div>
                )}
                <div className="cellnote">Fetched {aiResult.at} · AI-grounded web search — verify before booking.</div>
              </div>
            )}
          </div>
        </section>

        {/* ---------- Suggested costs ---------- */}
        <section className="card">
          <h2>Suggested costs <span className="muted">({destCurrency}, editable)</span></h2>
          <p className="hint">Researched {STYLE_LABELS[style].toLowerCase()} averages for {dest.name} — adjust to match your plan.</p>
          {COST_FIELDS.map((f) => (
            <label className="field inline" key={f.key}>
              <span>{f.label}</span>
              <input
                type="number" min="0" step="0.01" value={costs[f.key]}
                onChange={(e) => setCosts((p) => ({ ...p, [f.key]: num(e.target.value, 0) }))}
              />
            </label>
          ))}
          {dest.type === 'international' && (
            <>
              <label className="field inline">
                <span>Visa fee (per person)</span>
                <input type="number" min="0" step="0.01" value={costs.visa}
                  onChange={(e) => setCosts((p) => ({ ...p, visa: num(e.target.value, 0) }))} />
              </label>
              <label className="field inline">
                <span>Flights ({origin.airport} round trip, per person)</span>
                <input type="number" min="0" step="0.01" value={costs.flight}
                  onChange={(e) => setCosts((p) => ({ ...p, flight: num(e.target.value, 0) }))} />
              </label>
              {dest.land && (
                <>
                  <label className="field inline">
                    <span>Bus fare (round trip, per person, BDT)</span>
                    <input type="number" min="0" step="0.01" value={costs.bus}
                      onChange={(e) => setCosts((p) => ({ ...p, bus: num(e.target.value, 0) }))} />
                  </label>
                  {dest.land.train > 0 && (
                    <label className="field inline">
                      <span>Train fare (round trip, per person, BDT)</span>
                      <input type="number" min="0" step="0.01" value={costs.train}
                        onChange={(e) => setCosts((p) => ({ ...p, train: num(e.target.value, 0) }))} />
                    </label>
                  )}
                </>
              )}
            </>
          )}
          <div className="live-links">
            <span>Check live prices:</span>
            <a href={flightUrl} target="_blank" rel="noreferrer">Flights {origin.airport} → {dest.airport}</a>
            <a href={hotelUrl} target="_blank" rel="noreferrer">Hotels in {dest.name}</a>
          </div>
        </section>

        {/* ---------- Map ---------- */}
        <section className="card wide no-print">
          <h2>Pick on the map</h2>
          <p className="hint">Click a green marker to set the destination. The orange marker is your origin — the dashed line shows your route.</p>
          <TripMap
            destinations={DESTINATIONS.filter((d) => d.type === mode)}
            selectedId={destinationId}
            origin={origin}
            onSelect={changeDestination}
          />
        </section>

        {/* ---------- Expenses ---------- */}
        <section className="card wide">
          <h2>Expenses</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th><th>Unit cost ({destCurrency})</th><th>Qty</th><th>Applies to</th><th className="right">Total ({displayCurrency})</th><th></th>
                </tr>
              </thead>
              <tbody>
                {allRows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="cellname">{r.name}</div>
                      <div className="cellnote">{r.note}</div>
                      {r.hasMode && (
                        <select
                          className="modesel"
                          value={r.selMode}
                          onChange={(e) => {
                            setGetThereMode(e.target.value);
                            setUnitOv((p) => { const n = { ...p }; delete n.getthere; return n; });
                          }}
                        >
                          {r.modes.map((m) => (
                            <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <input
                        className="num" type="number" min="0" step="0.01" value={r.unit}
                        onChange={(e) => {
                          const v = num(e.target.value, 0);
                          if (r.custom) setCustomRows((p) => p.map((x) => (x.id === r.id ? { ...x, unit: v } : x)));
                          else setUnitOv((p) => ({ ...p, [r.id]: v }));
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="num" type="number" min="0" step="0.01" value={r.qty}
                        onChange={(e) => {
                          const v = num(e.target.value, 0);
                          if (r.custom) setCustomRows((p) => p.map((x) => (x.id === r.id ? { ...x, qty: v } : x)));
                          else setQtyOv((p) => ({ ...p, [r.id]: v }));
                        }}
                      />
                    </td>
                    <td>
                      <select
                        value={r.appliesTo}
                        onChange={(e) => {
                          if (r.custom) setCustomRows((p) => p.map((x) => (x.id === r.id ? { ...x, appliesTo: e.target.value } : x)));
                          else setAppliesOv((p) => ({ ...p, [r.id]: e.target.value }));
                        }}
                      >
                        <option value="person">Per person</option>
                        <option value="group">Group</option>
                      </select>
                    </td>
                    <td className="right strong">{fmt(rowTotal(r))}</td>
                    <td>
                      {r.custom && (
                        <button className="iconbtn" title="Remove" onClick={() => setCustomRows((p) => p.filter((x) => x.id !== r.id))}>×</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="custom-add no-print">
            <h3>Add custom expense</h3>
            <div className="custom-grid">
              <input placeholder="e.g. Travel insurance" value={newCustom.name} onChange={(e) => setNewCustom((p) => ({ ...p, name: e.target.value }))} />
              <input className="num" type="number" min="0" step="0.01" placeholder={`Unit cost (${destCurrency})`} value={newCustom.unit}
                onChange={(e) => setNewCustom((p) => ({ ...p, unit: e.target.value }))} />
              <input className="num" type="number" min="0" step="1" placeholder="Qty" value={newCustom.qty}
                onChange={(e) => setNewCustom((p) => ({ ...p, qty: e.target.value }))} />
              <select value={newCustom.appliesTo} onChange={(e) => setNewCustom((p) => ({ ...p, appliesTo: e.target.value }))}>
                <option value="group">Group</option>
                <option value="person">Per person</option>
              </select>
              <button className="btn primary" onClick={addCustomRow}>Add</button>
            </div>
          </div>
        </section>

        {/* ---------- Summary ---------- */}
        <section className="card">
          <h2>Summary</h2>
          <div className="totals">
            <div className="trow"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <label className="trow slider">
              <span>Contingency ({num(contingency, 0)}%)</span>
              <input type="range" min="0" max="25" value={contingency} onChange={(e) => setContingency(num(e.target.value, 0))} />
            </label>
            <div className="trow grand"><span>Total trip cost</span><span>{fmt(grandTotal)}</span></div>
            <div className="trow perperson"><span>Per person ({tCount} traveler{tCount > 1 ? 's' : ''})</span><span>{fmt(perPerson)}</span></div>
          </div>
          <h3>Cost breakdown</h3>
          <div className="bars">
            {breakdown.map((b) => (
              <div className="bar-row" key={b.name}>
                <span className="bar-label">{b.name}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${subtotal ? Math.max(2, (b.total / subtotal) * 100) : 0}%` }} />
                </div>
                <span className="bar-val">{fmt(b.total)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Saved trips ---------- */}
        <section className="card no-print">
          <h2>Saved trips</h2>
          {savedTrips.length === 0 ? (
            <p className="hint">No saved trips yet. Use “Save trip” to keep this plan in this browser.</p>
          ) : (
            <ul className="saved-list">
              {savedTrips.map((t) => (
                <li key={t.id}>
                  <div>
                    <div className="cellname">{t.name}</div>
                    <div className="cellnote">{new Date(t.savedAt).toLocaleString()}</div>
                  </div>
                  <div className="saved-actions">
                    <button className="btn ghost sm" onClick={() => loadTrip(t)}>Load</button>
                    <button className="btn ghost sm danger" onClick={() => setSavedTrips((p) => p.filter((x) => x.id !== t.id))}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="hint">Saved trips live in this browser only (local storage).</p>
        </section>
      </main>

      <footer className="no-print">
        <p>Suggested costs are researched {STYLE_LABELS[style].toLowerCase()} averages (Oct 2026) — verify live flight &amp; hotel prices before booking.</p>
      </footer>

      {/* ---------- Print report ---------- */}
      <div id="print-report">
        <h1>Travel Cost Estimate</h1>
        <p><strong>{tripName.trim() || `${dest.name} trip`}</strong> · {origin.name} → {dest.name}{dest.type === 'international' ? `, ${dest.country}` : ''}</p>
        <p>{startDate} → {endDate} ({nights} nights) · {tCount} traveler(s) · {STYLE_LABELS[style]} · Shown in {displayCurrency}{displayCurrency === 'BDT' && destCurrency === 'USD' ? ` (1 USD = ${fx} BDT${fxLive ? ', live rate' : ''})` : ''}</p>
        <table>
          <thead><tr><th>Category</th><th>Unit</th><th>Qty</th><th>Applies to</th><th className="right">Total</th></tr></thead>
          <tbody>
            {allRows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{fmtDest(r.unit)}</td>
                <td>{r.qty}</td>
                <td>{r.appliesTo === 'person' ? 'Per person' : 'Group'}</td>
                <td className="right">{fmt(rowTotal(r))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Subtotal: {fmt(subtotal)} · Contingency ({num(contingency, 0)}%): {fmt(contingencyAmt)}</p>
        <h2>Total: {fmt(grandTotal)} &nbsp;·&nbsp; Per person: {fmt(perPerson)}</h2>
        <p className="fine">Estimates only — verify live prices before booking.</p>
      </div>
    </div>
  );
}
