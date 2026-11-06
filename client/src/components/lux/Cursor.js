'use client';

import { useEffect, useRef } from 'react';

// A champagne dot with a trailing ring. It swells over interactive elements and
// shows a short label over anything marked data-cursor="View". Desktop only.
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    const root = document.documentElement;
    root.classList.add('has-cursor');
    let x = -100, y = -100, rx = -100, ry = -100;
    let visible = false;
    let raf;

    const describe = (t) => {
      const labelled = t?.closest('[data-cursor]');
      const interactive = t?.closest('a, button, [role="tab"], label, summary, [data-magnetic]');
      const typing = t?.closest('input, textarea, select');
      ring.current.dataset.state = typing ? 'hidden' : labelled ? 'label' : interactive ? 'hover' : 'idle';
      dot.current.dataset.state = typing || labelled ? 'hidden' : 'idle';
      label.current.textContent = labelled ? labelled.getAttribute('data-cursor') : '';
    };
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        dot.current.style.opacity = '1';
        ring.current.style.opacity = '1';
      }
      describe(e.target instanceof Element ? e.target : null);
    };
    // Scrolling moves content under a still pointer: re-read what is beneath it
    const onScroll = () => visible && describe(document.elementFromPoint(x, y));
    const leave = () => {
      visible = false;
      dot.current.style.opacity = '0';
      ring.current.style.opacity = '0';
    };
    const down = () => ring.current.classList.add('scale-90');
    const up = () => ring.current.classList.remove('scale-90');

    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
      root.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] hidden [@media(pointer:fine)]:block">
      <div
        ref={ring}
        data-state="idle"
        className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full border border-gold/60 opacity-0 transition-[width,height,background,border-color,opacity] duration-500 ease-out data-[state=hidden]:!opacity-0 data-[state=hover]:h-16 data-[state=hover]:w-16 data-[state=hover]:border-gold/80 data-[state=hover]:bg-gold/10 data-[state=label]:h-24 data-[state=label]:w-24 data-[state=label]:border-transparent data-[state=label]:bg-gold-light/95"
      >
        <span ref={label} className="text-[11px] font-semibold uppercase tracking-[0.2em] text-obsidian" />
      </div>
      <div
        ref={dot}
        data-state="idle"
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-gold-light opacity-0 transition-opacity duration-300 data-[state=hidden]:!opacity-0"
      />
    </div>
  );
}
