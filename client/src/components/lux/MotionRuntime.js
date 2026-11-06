'use client';

import { useEffect } from 'react';

/*
  One small runtime drives every motion effect on the site through data attributes,
  so pages stay server-rendered and accessible:

  data-reveal[="mask"|"line"]   fade/rise, curtain or line reveal when scrolled into view
  data-magnetic[="0.35"]        element drifts toward the pointer (buttons, links)
  data-tilt[="10"]              3D tilt following the pointer; sets --rx / --ry / --mx / --my
  data-parallax="0.15"          vertical parallax depth while scrolling
  data-progress="through|sticky" sets --p (0→1) as the section scrolls; with data-steps="n"
                                 it also sets data-step (0…n-1) for scroll-driven chapters
  data-header                   gets data-scrolled="true" once the page leaves the top
*/
export default function MotionRuntime() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    // ── Reveal on scroll ──────────────────────────────────────────
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' }
    );
    const observeReveals = (root = document) => {
      root.querySelectorAll?.('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el));
    };
    observeReveals();

    // ── Scroll-linked effects ─────────────────────────────────────
    let parallaxEls = [];
    let progressEls = [];
    let headerEl = null;
    const collect = () => {
      parallaxEls = reduce ? [] : [...document.querySelectorAll('[data-parallax]')];
      progressEls = [...document.querySelectorAll('[data-progress]')];
      headerEl = document.querySelector('[data-header]');
    };
    collect();

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const vh = window.innerHeight;
        if (headerEl) headerEl.dataset.scrolled = window.scrollY > 24 ? 'true' : 'false';

        for (const el of parallaxEls) {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) continue;
          const speed = parseFloat(el.dataset.parallax) || 0.15;
          const offset = (r.top + r.height / 2 - vh / 2) * -speed;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        }

        for (const el of progressEls) {
          const r = el.getBoundingClientRect();
          let p;
          if (el.dataset.progress === 'sticky') {
            p = -r.top / Math.max(1, r.height - vh);
          } else {
            p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
          }
          p = Math.min(1, Math.max(0, p));
          el.style.setProperty('--p', p.toFixed(4));
          const steps = parseInt(el.dataset.steps, 10);
          if (steps) {
            const step = String(Math.min(steps - 1, Math.floor(p * steps)));
            if (el.dataset.step !== step) el.dataset.step = step;
          }
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // ── Pointer effects: magnetic + tilt (desktop only) ───────────
    let magnet = null;
    let tilt = null;
    const resetMagnet = () => {
      if (magnet) magnet.style.transform = '';
      magnet = null;
    };
    const resetTilt = () => {
      if (tilt) {
        tilt.style.setProperty('--rx', '0deg');
        tilt.style.setProperty('--ry', '0deg');
        tilt.style.setProperty('--mx', '50%');
        tilt.style.setProperty('--my', '50%');
      }
      tilt = null;
    };
    const onPointerMove = (e) => {
      const t = e.target instanceof Element ? e.target : null;
      const m = t?.closest('[data-magnetic]') || null;
      if (m !== magnet) resetMagnet();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        const s = parseFloat(m.dataset.magnetic) || 0.35;
        const x = (e.clientX - (r.left + r.width / 2)) * s;
        const y = (e.clientY - (r.top + r.height / 2)) * s;
        m.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      }
      const tl = t?.closest('[data-tilt]') || null;
      if (tl !== tilt) resetTilt();
      if (tl) {
        tilt = tl;
        const r = tl.getBoundingClientRect();
        const max = parseFloat(tl.dataset.tilt) || 10;
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        tl.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        tl.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        tl.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
        tl.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      }
    };
    const onLeave = () => {
      resetMagnet();
      resetTilt();
    };
    if (finePointer && !reduce) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      document.addEventListener('pointerleave', onLeave);
    }

    // ── Pick up content rendered after navigation or streaming ────
    const mo = new MutationObserver((records) => {
      let changed = false;
      for (const rec of records) {
        for (const n of rec.addedNodes) {
          if (n.nodeType !== 1) continue;
          changed = true;
          if (n.matches?.('[data-reveal]')) io.observe(n);
          observeReveals(n);
        }
      }
      if (changed) {
        collect();
        onScroll();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return null;
}
