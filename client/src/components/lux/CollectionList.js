'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import ProductArt from '@/components/ProductArt';

// An editorial index of the four product lines. On desktop, a glass preview of
// each line's artwork floats after the cursor as you move down the list.
export default function CollectionList({ lines }) {
  const [active, setActive] = useState(-1);
  const wrap = useRef(null);
  const preview = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine) return;
    let x = 0, y = 0, cx = 0, cy = 0, raf;
    const el = wrap.current;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
    };
    const loop = () => {
      cx += (x - cx) * (reduce ? 1 : 0.12);
      cy += (y - cy) * (reduce ? 1 : 0.12);
      if (preview.current) preview.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    el.addEventListener('pointermove', move);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', move);
    };
  }, []);

  return (
    <div ref={wrap} className="relative" onPointerLeave={() => setActive(-1)}>
      <ol className="border-t border-line">
        {lines.map((l, i) => {
          const dim = active !== -1 && active !== i;
          return (
            <li key={l.type} data-reveal style={{ '--delay': `${i * 110}ms` }}>
              <Link
                href={`/products?q=${encodeURIComponent(l.type)}`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(-1)}
                data-cursor="View"
                className={`group grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-line py-9 transition-opacity duration-500 sm:gap-10 lg:grid-cols-[110px_1.3fr_1fr_auto] lg:py-12 ${dim ? 'opacity-30' : 'opacity-100'}`}
              >
                <span className="display text-2xl italic text-gold sm:text-3xl">{l.numeral}.</span>
                <span className="flex items-center gap-5">
                  <span className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-line lg:hidden">
                    <ProductArt product={{ type: l.type, name: l.title }} />
                  </span>
                  <span className="display text-[clamp(2rem,5vw,4.5rem)] text-ivory transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-4">
                    {l.title}
                  </span>
                </span>
                <span className="hidden text-[15px] leading-relaxed text-mute lg:block">{l.text}</span>
                <span className="flex flex-col items-end gap-2">
                  <span className="text-[11px] uppercase tracking-[0.26em] text-dim">{l.count} pieces</span>
                  <span className="text-sm text-gold-light">{l.range}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Floating preview (decorative; the list itself carries all information) */}
      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 hidden h-[300px] w-[360px] lg:block"
      >
        {lines.map((l, i) => (
          <div
            key={l.type}
            className={`glass absolute inset-0 overflow-hidden rounded-2xl p-2 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${active === i ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
            style={{ rotate: `${(i % 2 ? 1 : -1) * 3}deg` }}
          >
            <div className="h-full w-full overflow-hidden rounded-xl">
              <ProductArt product={{ type: l.type, name: l.title }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
