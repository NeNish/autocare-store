'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clientApi, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import AddToCartButton from '@/components/AddToCartButton';

const CONNECTORS = ['J-hook', 'U-hook', 'Pinch tab', 'Push button', 'Side pin', 'Bayonet', 'Other'];

function MatchList({ data, onReset }) {
  const { exact = [], close = [], toleranceIn = 1 } = data;
  if (!exact.length && !close.length) {
    return (
      <div className="rounded-2xl border border-line p-6">
        <p className="text-[17px] text-frost">No blade pair in our range matches these sizes.</p>
        <p className="mt-2 text-[14px] text-mute">Double-check your measurements, or ask the assistant for help. We only show pairs whose recorded lengths match, so you never get a guess.</p>
        {onReset && <button onClick={onReset} className="link-tech mt-4">Try different sizes</button>}
      </div>
    );
  }
  const Row = ({ m, kind }) => (
    <li className="grid gap-4 rounded-2xl border border-line p-5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${kind === 'exact' ? 'border-emerald-300/40 text-emerald-100' : 'border-amber-200/40 text-amber-100'}`}>
            {kind === 'exact' ? 'Exact size match' : `Within ${toleranceIn}″ · check before buying`}
          </span>
          {m.connectorFit === 'yes' && <span className="rounded-full border border-accent/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ice">Connector fits</span>}
          {m.connectorFit === 'unknown' && <span className="rounded-full border border-line-strong px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Connector not checked</span>}
        </div>
        <Link href={`/products/${m.product.slug}`} className="mt-3 block text-[19px] text-frost hover:text-ice">{m.product.name}</Link>
        <p className="mt-1 font-mono text-[12px] text-dim">
          Blade lengths {m.sizes.map((s) => `${s}″`).join(' + ')}
          {m.product.connectors?.length ? ` · fits ${m.product.connectors.join(' / ')}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-2">
        <span className="font-mono text-[15px] text-ice">{formatPrice(m.product.price)}</span>
        {m.product.stock > 0 ? <AddToCartButton product={m.product} compact /> : <span className="hud text-rose-200">Out of stock</span>}
      </div>
    </li>
  );
  return (
    <ul className="space-y-3">
      {exact.map((m) => <Row key={m.product._id} m={m} kind="exact" />)}
      {close.map((m) => <Row key={m.product._id} m={m} kind="close" />)}
    </ul>
  );
}

function ByMeasurement({ initial }) {
  const router = useRouter();
  const [driver, setDriver] = useState(initial.driver || '');
  const [passenger, setPassenger] = useState(initial.passenger || '');
  const [connector, setConnector] = useState(initial.connector || 'J-hook');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(d = driver, p = passenger, c = connector) {
    setError('');
    const dn = Number(d);
    const pn = Number(p);
    if (!(dn >= 8 && dn <= 40) || !(pn >= 8 && pn <= 40)) {
      setError('Enter both blade lengths in inches, between 8 and 40.');
      return;
    }
    setBusy(true);
    try {
      const qs = new URLSearchParams({ driver: String(dn), passenger: String(pn), ...(c && c !== 'Other' ? { connector: c } : {}) });
      const data = await clientApi(`/fitments/match?${qs}`);
      setResult(data);
      router.replace(`/fit?tab=measure&driver=${dn}&passenger=${pn}&connector=${encodeURIComponent(c)}`, { scroll: false });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // A pre-filled link (e.g. from a product page) runs the match straight away
  useEffect(() => {
    const dn = Number(initial.driver);
    const pn = Number(initial.passenger);
    if (!(dn >= 8 && dn <= 40 && pn >= 8 && pn <= 40)) return;
    const c = initial.connector || 'J-hook';
    const qs = new URLSearchParams({ driver: String(dn), passenger: String(pn), ...(c !== 'Other' ? { connector: c } : {}) });
    clientApi(`/fitments/match?${qs}`).then(setResult).catch((err) => setError(errorMessage(err)));
  }, [initial.driver, initial.passenger, initial.connector]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="space-y-6"
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fit-driver" className="label">Driver side (in)</label>
            <input id="fit-driver" type="number" inputMode="decimal" min="8" max="40" step="0.5" className="input" value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="e.g. 22" />
          </div>
          <div>
            <label htmlFor="fit-passenger" className="label">Passenger side (in)</label>
            <input id="fit-passenger" type="number" inputMode="decimal" min="8" max="40" step="0.5" className="input" value={passenger} onChange={(e) => setPassenger(e.target.value)} placeholder="e.g. 16" />
          </div>
        </div>
        <div>
          <label htmlFor="fit-connector" className="label">Arm connector</label>
          <select id="fit-connector" className="input" value={connector} onChange={(e) => setConnector(e.target.value)}>
            {CONNECTORS.map((c) => <option key={c} value={c}>{c === 'Other' ? 'Not sure' : c}</option>)}
          </select>
        </div>
        {error && <p role="alert" className="text-[13px] text-rose-200">{error}</p>}
        <button type="submit" className="btn-primary h-14 w-full" disabled={busy}>{busy ? 'Matching…' : 'Find matching blades'}</button>

        <div className="rounded-2xl border border-line p-5">
          <p className="hud text-accent-light">How to measure</p>
          <svg viewBox="0 0 320 90" className="mt-4 w-full" role="img" aria-label="Measure the rubber blade from one end to the other">
            <path d="M20 60 Q160 40 300 60" stroke="#c3cad5" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M20 66 Q160 46 300 66" stroke="#2f8cff" strokeWidth="1.5" fill="none" />
            <path d="M20 20 v20 M300 20 v20 M20 28 H300" stroke="#8fd0ff" strokeWidth="1" />
            <path d="M28 24 l-8 4 8 4 M292 24 l8 4 -8 4" stroke="#8fd0ff" strokeWidth="1" fill="none" />
          </svg>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-mute marker:text-accent-light">
            <li>Measure each rubber blade from end to end, in inches.</li>
            <li>The driver-side blade is usually the longer one.</li>
            <li>Check the connector where the blade clips onto the arm (most cars use a J-hook).</li>
          </ol>
        </div>
      </form>
      <div aria-live="polite">
        {result ? (
          <>
            <p className="hud mb-4">
              Results for {result.requested.driver}″ + {result.requested.passenger}″{result.requested.connector ? ` · ${result.requested.connector}` : ''}
            </p>
            <MatchList data={result} onReset={() => setResult(null)} />
          </>
        ) : (
          <div className="grid h-full min-h-[280px] place-items-center rounded-2xl border border-dashed border-line p-8 text-center">
            <p className="max-w-xs text-[14px] text-dim">Enter your blade lengths and we’ll show exactly which of our pairs match.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ByVehicle({ onMeasure }) {
  const [makes, setMakes] = useState(null);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [sel, setSel] = useState({ make: '', model: '', year: '' });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    clientApi('/fitments/makes').then((d) => setMakes(d.makes)).catch((e) => setError(errorMessage(e)));
  }, []);

  async function pickMake(make) {
    setSel({ make, model: '', year: '' });
    setModels([]);
    setYears([]);
    setResults(null);
    if (make) setModels((await clientApi(`/fitments/models?make=${encodeURIComponent(make)}`)).models);
  }
  async function pickModel(model) {
    setSel((s) => ({ ...s, model, year: '' }));
    setYears([]);
    setResults(null);
    if (model) setYears((await clientApi(`/fitments/years?make=${encodeURIComponent(sel.make)}&model=${encodeURIComponent(model)}`)).years);
  }
  async function pickYear(year) {
    setSel((s) => ({ ...s, year }));
    setResults(null);
    if (!year) return;
    try {
      const d = await clientApi(`/fitments/lookup?make=${encodeURIComponent(sel.make)}&model=${encodeURIComponent(sel.model)}&year=${year}`);
      setResults(d.results);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (error) return <p className="text-rose-200">{error}</p>;
  if (makes === null) return <p className="hud">Loading vehicles…</p>;
  if (makes.length === 0) {
    return (
      <div className="rounded-2xl border border-line p-8">
        <p className="text-[20px] text-frost">Verified vehicle data is on its way.</p>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-mute">
          We only list vehicles whose wiper sizes have been checked against a verifiable source, so there are no vehicles to choose from yet. In the meantime, measuring your current blades takes a minute and is just as precise.
        </p>
        <button onClick={onMeasure} className="btn-primary mt-6">Measure my blades instead</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="fit-make" className="label">Make</label>
          <select id="fit-make" className="input" value={sel.make} onChange={(e) => pickMake(e.target.value)}>
            <option value="">Select make</option>
            {makes.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="fit-model" className="label">Model</label>
          <select id="fit-model" className="input" value={sel.model} onChange={(e) => pickModel(e.target.value)} disabled={!sel.make}>
            <option value="">Select model</option>
            {models.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="fit-year" className="label">Year</label>
          <select id="fit-year" className="input" value={sel.year} onChange={(e) => pickYear(e.target.value)} disabled={!sel.model}>
            <option value="">Select year</option>
            {years.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div aria-live="polite" className="space-y-8">
        {results?.length === 0 && <p className="text-mute">No verified record covers that year. Try measuring your blades instead.</p>}
        {results?.map((r) => (
          <div key={r.fitment._id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] p-5">
              <div>
                <p className="text-[17px] text-frost">
                  {r.fitment.make} {r.fitment.model}{r.fitment.variant ? ` ${r.fitment.variant}` : ''} · {r.fitment.yearFrom}–{r.fitment.yearTo || 'present'}
                </p>
                <p className="mt-1 font-mono text-[12px] text-ice">
                  Driver {r.fitment.driverIn}″ · Passenger {r.fitment.passengerIn}″{r.fitment.rearIn ? ` · Rear ${r.fitment.rearIn}″` : ''} · {r.fitment.connector}
                </p>
              </div>
              <p className="hud max-w-xs text-right normal-case tracking-normal">Verified from: {r.fitment.source}</p>
            </div>
            <MatchList data={r} />
            {r.fitment.notes && <p className="text-[13px] text-dim">Note: {r.fitment.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FitFinder() {
  const params = useSearchParams();
  const initial = {
    driver: params.get('driver') || '',
    passenger: params.get('passenger') || '',
    connector: params.get('connector') || '',
  };
  const [tab, setTab] = useState(() => {
    const t = params.get('tab');
    if (t === 'vehicle' || t === 'measure') return t;
    return initial.driver ? 'measure' : 'vehicle';
  });

  const tabs = [
    ['vehicle', 'By vehicle'],
    ['measure', 'By measurement'],
  ];
  return (
    <div>
      <div role="tablist" aria-label="Find blades" className="mb-10 inline-flex rounded-full border border-line p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`h-11 rounded-full px-6 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${tab === id ? 'bg-accent text-white' : 'text-mute hover:text-frost'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'vehicle' ? <ByVehicle onMeasure={() => setTab('measure')} /> : <ByMeasurement initial={initial} />}
      </div>
    </div>
  );
}
