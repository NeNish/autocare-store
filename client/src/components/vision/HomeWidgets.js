'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Homepage: quick measurement entry for the compatibility finder
export function FitTeaser() {
  const router = useRouter();
  const [d, setD] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const dn = Number(d);
        const pn = Number(p);
        if (!(dn >= 8 && dn <= 40 && pn >= 8 && pn <= 40)) return setErr('Enter both lengths in inches (8–40).');
        router.push(`/fit?tab=measure&driver=${dn}&passenger=${pn}`);
      }}
      className="glass rounded-[24px] p-6 sm:p-8"
    >
      <p className="hud text-accent-light">Measure & match</p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="t-driver" className="label">Driver side (in)</label>
          <input id="t-driver" type="number" inputMode="decimal" min="8" max="40" step="0.5" className="input" value={d} onChange={(e) => setD(e.target.value)} placeholder="22" />
        </div>
        <div>
          <label htmlFor="t-pass" className="label">Passenger side (in)</label>
          <input id="t-pass" type="number" inputMode="decimal" min="8" max="40" step="0.5" className="input" value={p} onChange={(e) => setP(e.target.value)} placeholder="16" />
        </div>
      </div>
      {err && <p role="alert" className="mt-3 text-[13px] text-rose-200">{err}</p>}
      <button type="submit" data-magnetic="0.2" className="btn-primary mt-6 h-14 w-full">Find my blades</button>
      <a href="/fit?tab=vehicle" className="link-tech mt-5">Or search by vehicle →</a>
    </form>
  );
}

// Homepage: open the assistant with a ready-made question
export function AssistantPrompts({ prompts }) {
  return (
    <div className="flex flex-wrap gap-3">
      {prompts.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('assistant:open', { detail: { prompt: q } }))}
          className="group flex items-center gap-3 rounded-full border border-line px-5 py-3 text-left text-[14px] text-silver transition-colors hover:border-accent/60 hover:text-ice"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-light transition-transform group-hover:scale-150" />
          {q}
        </button>
      ))}
    </div>
  );
}
