'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Product3D = dynamic(() => import('./Product3D'), { ssr: false });

// A pinned, scroll-driven sequence: four chapters, one 3D model that changes with each.
export default function StoryChapters({ chapters }) {
  const ref = useRef(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
        setProgress(p);
        setStep(Math.min(chapters.length - 1, Math.floor(p * chapters.length)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [chapters.length]);

  const c = chapters[step];
  return (
    <section ref={ref} aria-labelledby="anatomy-title" className="relative h-[420vh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(60% 60% at 72% 50%, #0c1a30 0%, #050608 70%)' }} />
        <div className="container-page grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow">Anatomy of clarity</p>
            <h2 id="anatomy-title" className="sr-only">Anatomy of clarity: {chapters.map((x) => x.verb).join(', ')}</h2>
            <div className="relative mt-8 min-h-[440px] sm:min-h-[400px]">
              {chapters.map((ch, i) => (
                <div
                  key={ch.verb}
                  aria-hidden={i !== step}
                  className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${i === step ? 'translate-y-0 opacity-100 blur-none' : 'pointer-events-none translate-y-6 opacity-0 blur-sm'}`}
                >
                  <p className="hud">0{i + 1} / 0{chapters.length} · {ch.line}</p>
                  <h3 className="display chrome-text mt-4 text-[clamp(4rem,9vw,8.5rem)]">{ch.verb}</h3>
                  <p className="mt-6 max-w-md text-[16px] leading-[1.8] text-mute">{ch.text}</p>
                  {ch.facts?.length > 0 && (
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {ch.facts.map((f) => (
                        <li key={f} className="rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-silver">{f}</li>
                      ))}
                    </ul>
                  )}
                  <Link href={ch.href} tabIndex={i === step ? 0 : -1} className="link-tech mt-8 inline-block">Explore {ch.line.toLowerCase()} →</Link>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-4" aria-hidden="true">
              <span className="font-mono text-[11px] text-ice">0{step + 1}</span>
              <div className="h-px w-48 bg-line-strong">
                <div className="h-px bg-accent-light" style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="font-mono text-[11px] text-dim">0{chapters.length}</span>
            </div>
          </div>
          <div className="relative aspect-square w-full max-w-[min(640px,78svh)] justify-self-center">
            <div aria-hidden="true" className="absolute inset-[8%] rounded-full border border-line" />
            <div aria-hidden="true" className="absolute inset-[18%] rounded-full border border-accent/20" />
            <Product3D key={c.type} type={c.type} lengths={c.lengths} className="absolute inset-0" vignette label={`3D model: ${c.line}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
