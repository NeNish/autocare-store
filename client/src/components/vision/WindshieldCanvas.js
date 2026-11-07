'use client';

import { useEffect, useRef } from 'react';

// React wrapper for the WindshieldSim engine. Options update live;
// onStats receives { clarity, label, film, drops, wiping } a few times a second.
export default function WindshieldCanvas({ options, onStats, className = '', label = 'Simulated view through a rainy windshield' }) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const statsRef = useRef(onStats);
  const firstOptions = useRef(options);

  useEffect(() => {
    statsRef.current = onStats;
  }, [onStats]);

  useEffect(() => {
    let sim;
    let off;
    let cancelled = false;
    import('@/lib/windshield-sim').then(({ default: WindshieldSim }) => {
      if (cancelled || !canvasRef.current) return;
      sim = new WindshieldSim(canvasRef.current, firstOptions.current);
      off = sim.onStats((s) => statsRef.current?.(s));
      sim.start();
      simRef.current = sim;
    });
    return () => {
      cancelled = true;
      off?.();
      sim?.destroy();
      simRef.current = null;
    };
  }, []);

  useEffect(() => {
    simRef.current?.setOptions(options);
  }, [options]);

  return <canvas ref={canvasRef} role="img" aria-label={label} className={`block h-full w-full ${className}`} />;
}
