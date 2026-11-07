'use client';

import { useState } from 'react';
import WindshieldCanvas from './WindshieldCanvas';

const HERO_OPTIONS = { scene: 'night', rain: 0.62, wiper: 'intermittent', blade: 'new', repellent: false, fog: 0, cockpit: true };

// Full-screen live windshield with a cockpit HUD that reads the simulation.
export default function HeroWindshield() {
  const [stats, setStats] = useState(null);
  return (
    <>
      <div className="absolute inset-0">
        <WindshieldCanvas options={HERO_OPTIONS} onStats={setStats} label="Night drive through a rain-covered windshield as the wipers sweep it clear" />
      </div>
      <div aria-hidden="true" className="hero-fade absolute right-6 top-28 hidden w-56 space-y-2 sm:right-10 lg:block" style={{ '--d': '600ms' }}>
        {[
          ['Rain sensor', 'Active'],
          ['Wipers', stats?.wiping ? 'Sweeping' : 'Auto · interval'],
          ['Visibility', stats?.label || '—'],
        ].map(([k, v]) => (
          <div key={k} className="glass flex items-center justify-between rounded-xl px-4 py-2.5">
            <span className="hud">{k}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ice">{v}</span>
          </div>
        ))}
        <div className="glass rounded-xl px-4 py-3">
          <span className="hud">Clarity · live</span>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-accent-deep to-accent-light transition-[width] duration-500" style={{ width: `${Math.round((stats?.clarity ?? 0) * 100)}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}
