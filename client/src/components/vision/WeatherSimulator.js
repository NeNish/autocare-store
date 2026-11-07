'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import WindshieldCanvas from './WindshieldCanvas';

/*
  Interactive weather simulator: set conditions and equipment, watch the glass.
  The clarity reading is computed from the simulation itself (water film, drops, fog)
  and is illustrative only; it is not a measurement of any product.
*/

const PRESETS = [
  { id: 'drizzle', label: 'City drizzle', o: { scene: 'night', rain: 0.25, fog: 0, wiper: 'intermittent' } },
  { id: 'monsoon', label: 'Monsoon downpour', o: { scene: 'dusk', rain: 0.95, fog: 0.1, wiper: 'high' } },
  { id: 'storm', label: 'Night storm', o: { scene: 'night', rain: 0.8, fog: 0.05, wiper: 'low' } },
  { id: 'fog', label: 'Fog & mist', o: { scene: 'day', rain: 0.15, fog: 0.6, wiper: 'intermittent' } },
];
const WIPERS = [
  ['off', 'Off'],
  ['intermittent', 'Interval'],
  ['low', 'Low'],
  ['high', 'High'],
];
const SCENES = [
  ['day', 'Day'],
  ['dusk', 'Dusk'],
  ['night', 'Night'],
];

function tipFor(o, stats) {
  if (o.blade === 'worn' && o.wiper !== 'off')
    return { text: 'See the wet arcs the blades leave behind? That is what worn rubber does. Fresh blades wipe in one clean pass.', href: '/products?q=Wiper%20Blades', cta: 'Beam wiper blades' };
  if (o.wiper === 'off' && o.rain > 0.3 && !o.repellent)
    return { text: 'With the wipers off, a water film quickly blurs the road. Try switching on Rain repellent: water beads up and runs off instead.', href: '/products?q=Rain%20Repellent', cta: 'Rain repellent' };
  if (o.repellent && o.rain > 0.2)
    return { text: 'With repellent on, rain gathers into beads and runs off at speed instead of forming a film. Wipers have less work to do.', href: '/products?q=Rain%20Repellent', cta: 'Rain repellent' };
  if (o.fog > 0.4)
    return { text: 'Outside fog can’t be wiped away. Slow down and use your low beams. Inside mist clears with the defogger and a dry microfiber cloth.', href: '/products?q=Microfiber%20Towel', cta: 'Microfiber care' };
  if (stats?.label === 'Clear')
    return { text: 'Good visibility. Fresh blades, clean glass and washer fluid keep it this way.', href: '/products', cta: 'Explore products' };
  return { text: 'Higher wiper speeds clear heavy rain faster. A clean, treated windshield makes every pass count.', href: '/products', cta: 'Explore products' };
}

function Segmented({ label, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="flex rounded-full border border-line p-1">
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`h-9 flex-1 rounded-full font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${value === v ? 'bg-accent text-white' : 'text-mute hover:text-frost'}`}
          >
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({ label, hint, checked, onChange, id }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line px-4 py-3 transition-colors hover:border-line-strong">
      <span>
        <span className="block text-[14px] text-frost">{label}</span>
        <span className="block text-[12px] text-dim">{hint}</span>
      </span>
      <span className="relative">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-7 w-12 rounded-full border border-line-strong bg-white/5 transition-colors peer-checked:border-accent peer-checked:bg-accent/40 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-accent-light" />
        <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-silver transition-transform duration-300 peer-checked:translate-x-5 peer-checked:bg-ice" />
      </span>
    </label>
  );
}

function Slider({ id, label, value, onChange, valueLabel }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label">{label}</label>
        <span className="font-mono text-[11px] text-ice">{valueLabel}</span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="slider"
        style={{ '--fill': `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export default function WeatherSimulator({ compact = false }) {
  const [o, setO] = useState({ scene: 'night', rain: 0.7, fog: 0, wiper: 'intermittent', blade: 'new', repellent: false });
  const [stats, setStats] = useState(null);
  const [preset, setPreset] = useState('storm');
  const set = (patch) => {
    setPreset(null);
    setO((cur) => ({ ...cur, ...patch }));
  };
  const options = useMemo(() => ({ ...o, cockpit: true }), [o]);
  const tip = tipFor(o, stats);
  const rainLabel = o.rain < 0.05 ? 'None' : o.rain < 0.35 ? 'Light' : o.rain < 0.7 ? 'Moderate' : 'Heavy';

  return (
    <div className={`grid gap-6 ${compact ? 'lg:grid-cols-[1fr_360px]' : 'xl:grid-cols-[1fr_400px]'}`}>
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-black">
        <div className={compact ? 'aspect-[16/10]' : 'aspect-[16/10] xl:aspect-auto xl:h-full xl:min-h-[640px]'}>
          <WindshieldCanvas
            options={options}
            onStats={setStats}
            label={`Simulated windshield: ${rainLabel.toLowerCase()} rain, ${o.scene}, wipers ${o.wiper}, ${o.blade} blades, repellent ${o.repellent ? 'on' : 'off'}`}
          />
        </div>
        {/* HUD readout */}
        <div className="pointer-events-none absolute left-4 right-4 top-4 flex flex-wrap items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
          <div className="glass rounded-2xl px-4 py-3">
            <p className="hud">Clarity · illustrative</p>
            <p className="mt-1 flex items-baseline gap-3">
              <span className={`text-2xl font-light tracking-tight ${stats?.label === 'Poor' ? 'text-rose-200' : stats?.label === 'Reduced' ? 'text-amber-100' : 'text-ice'}`} aria-live="polite">
                {stats?.label || '—'}
              </span>
            </p>
            <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent-light transition-[width] duration-500" style={{ width: `${Math.round((stats?.clarity ?? 0) * 100)}%` }} />
            </div>
          </div>
          <div className="glass hidden rounded-2xl px-4 py-3 sm:block">
            <p className="hud">Wipers · {o.wiper === 'intermittent' ? 'interval' : o.wiper}</p>
            <p className="hud mt-1">Rain · {rainLabel}</p>
            <p className="hud mt-1">Glass · {o.repellent ? 'hydrophobic' : 'untreated'}</p>
          </div>
        </div>
      </div>

      <div className="card flex flex-col gap-6 p-6">
        <div>
          <p className="label">Conditions</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={preset === p.id}
                onClick={() => {
                  setPreset(p.id);
                  setO((cur) => ({ ...cur, ...p.o }));
                }}
                className={`rounded-xl border px-3 py-2.5 text-left text-[13px] transition-colors ${preset === p.id ? 'border-accent bg-accent/15 text-ice' : 'border-line text-mute hover:border-line-strong hover:text-frost'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <Slider id="sim-rain" label="Rain" value={o.rain} valueLabel={rainLabel} onChange={(v) => set({ rain: v })} />
        <Slider id="sim-fog" label="Fog" value={o.fog} valueLabel={o.fog < 0.05 ? 'None' : o.fog < 0.4 ? 'Light' : 'Dense'} onChange={(v) => set({ fog: v })} />
        <Segmented label="Wipers" options={WIPERS} value={o.wiper} onChange={(v) => set({ wiper: v })} />
        {!compact && <Segmented label="Light" options={SCENES} value={o.scene} onChange={(v) => set({ scene: v })} />}
        <div className="space-y-2">
          <Toggle id="sim-repellent" label="Rain repellent" hint="Water beads and runs off" checked={o.repellent} onChange={(v) => set({ repellent: v })} />
          <Toggle id="sim-worn" label="Worn blades" hint="Hardened, uneven rubber" checked={o.blade === 'worn'} onChange={(v) => set({ blade: v ? 'worn' : 'new' })} />
        </div>
        <div className="rounded-2xl border border-accent/30 bg-accent/[0.07] p-4">
          <p className="text-[13px] leading-relaxed text-silver">{tip.text}</p>
          <Link href={tip.href} className="link-tech mt-3">{tip.cta} →</Link>
        </div>
        <p className="text-[11px] leading-relaxed text-dim">
          An illustrative simulation to show how conditions and equipment affect visibility. It does not measure the performance of any product.
        </p>
      </div>
    </div>
  );
}
