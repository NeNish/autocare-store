'use client';

import { useEffect, useRef } from 'react';

// The opening sequence. It is pure CSS (see .intro in globals.css) so it finishes
// even before JavaScript loads; this component only lets visitors skip it.
// It plays once per browser session and never for reduced-motion visitors.
export default function Intro() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Finishing also releases the hero's entrance animations (see --hero-delay)
    const finish = () => {
      el.classList.add('is-done');
      document.documentElement.classList.add('intro-seen');
    };
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
    };
    el.addEventListener('click', finish);
    window.addEventListener('keydown', onKey, { once: true });
    const t = setTimeout(finish, 3900);
    return () => {
      clearTimeout(t);
      el.removeEventListener('click', finish);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="intro" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 55%, #1a1f30 0%, #07080b 70%)' }}
      />
      <div className="relative flex flex-col items-center gap-10">
        <svg width="168" height="168" viewBox="0 0 200 200" fill="none">
          <defs>
            <linearGradient id="intro-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#F6E7C6" />
              <stop offset="0.5" stopColor="#D4B27A" />
              <stop offset="1" stopColor="#8F6F3E" />
            </linearGradient>
            <linearGradient id="intro-sweep" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#F1DFB8" stopOpacity="0.9" />
              <stop offset="1" stopColor="#F1DFB8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle className="intro__ring" cx="100" cy="100" r="92" stroke="url(#intro-g)" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="78" stroke="#D4B27A" strokeOpacity="0.15" strokeWidth="0.6" />
          <g className="intro__sweep">
            <path d="M100 150 L100 40" stroke="url(#intro-sweep)" strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <text
            x="100"
            y="116"
            textAnchor="middle"
            fill="url(#intro-g)"
            style={{ font: '300 54px var(--font-display)', fontStyle: 'italic' }}
          >
            A
          </text>
        </svg>
        <p className="intro__word display text-[15px] uppercase text-gold-light sm:text-lg">AutoCare</p>
        <p className="intro__tag text-[10px] uppercase tracking-[0.5em] text-dim">The atelier of clarity</p>
      </div>
      <p className="absolute bottom-10 text-[10px] uppercase tracking-[0.4em] text-dim/70">Click to enter</p>
    </div>
  );
}
