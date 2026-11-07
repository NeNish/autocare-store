'use client';

import { useEffect, useRef } from 'react';

// Fine, slanted rain in three depth layers, lit in silver and champagne.
// Pauses when off-screen or when the tab is hidden; a single still frame
// for reduced-motion visitors.
export default function RainCanvas({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let w = 0, h = 0, drops = [], raf = 0, running = false;
    let mouseX = 0.5;

    const make = (initial) => {
      const depth = Math.random() ** 1.6 * 0.85 + 0.15;
      return {
        x: Math.random() * (w + 200) - 100,
        y: initial ? Math.random() * h : -40 - Math.random() * h * 0.4,
        len: 14 + depth * 46,
        speed: 3 + depth * 13,
        depth,
        accent: Math.random() < 0.28,
        alpha: 0.05 + depth * 0.32,
      };
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(260, Math.round((w * h) / 7000));
      drops = Array.from({ length: count }, () => make(true));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const wind = 0.16 + (mouseX - 0.5) * 0.22;
      for (const d of drops) {
        const dx = wind * d.len;
        const grad = ctx.createLinearGradient(d.x, d.y, d.x + dx, d.y + d.len);
        const c = d.accent ? '241, 223, 184' : '201, 205, 212';
        grad.addColorStop(0, `rgba(${c}, 0)`);
        grad.addColorStop(1, `rgba(${c}, ${d.alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.4 + d.depth * 0.9;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + dx, d.y + d.len);
        ctx.stroke();
        if (!reduce) {
          d.y += d.speed;
          d.x += wind * d.speed;
          if (d.y > h + 20 || d.x > w + 120) Object.assign(d, make(false));
        }
      }
    };

    const loop = () => {
      draw();
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw();
    const vis = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()));
    vis.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    const onMove = (e) => (mouseX = e.clientX / window.innerWidth);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      stop();
      vis.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`pointer-events-none h-full w-full ${className}`} />;
}
