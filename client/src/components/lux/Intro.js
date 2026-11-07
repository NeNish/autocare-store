'use client';

import { useEffect, useRef } from 'react';

// Opening: a vehicle "system check". Pure CSS (see .intro in globals.css), so it
// always completes; this component only lets visitors skip it. Once per session,
// never for reduced-motion visitors.
const CHECKS = ['Rain sensor', 'Wiper system', 'Glass surface', 'Washer circuit'];

export default function Intro() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const finish = () => {
      el.classList.add('is-done');
      document.documentElement.classList.add('intro-seen');
    };
    const onKey = (e) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) finish();
    };
    el.addEventListener('click', finish);
    window.addEventListener('keydown', onKey, { once: true });
    const t = setTimeout(finish, 3300);
    return () => {
      clearTimeout(t);
      el.removeEventListener('click', finish);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="intro" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 50%, #0c1726 0%, #050608 70%)' }} />
      <div className="intro__scan absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-accent-light to-transparent shadow-[0_0_24px_#2f8cff]" />
      <div className="relative flex flex-col items-center gap-9">
        <svg width="132" height="132" viewBox="0 0 200 200" fill="none">
          <circle className="intro__ring" cx="100" cy="100" r="92" stroke="#8fd0ff" strokeWidth="1" />
          <circle cx="100" cy="100" r="76" stroke="#c3cad5" strokeOpacity="0.15" strokeWidth="0.8" />
          <path d="M60 128 Q100 60 140 128" stroke="#eaf6ff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="100" cy="128" r="3" fill="#2f8cff" />
        </svg>
        <p className="intro__word font-mono text-[13px] uppercase text-ice sm:text-[15px]">AutoCare Vision</p>
        <ul className="grid grid-cols-2 gap-x-10 gap-y-2 font-mono text-[10px] uppercase tracking-[0.24em] text-dim">
          {CHECKS.map((c, i) => (
            <li key={c} className="intro__check flex items-center gap-3" style={{ animationDelay: `${0.9 + i * 0.22}s` }}>
              <span className="h-1.5 w-1.5 rounded-full bg-accent-light" /> {c} <span className="text-accent-light">OK</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="hud absolute bottom-10">Click to enter</p>
    </div>
  );
}
