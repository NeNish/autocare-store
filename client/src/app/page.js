import Link from 'next/link';
import { Suspense } from 'react';
import { serverApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import ProductArt from '@/components/ProductArt';
import AddToCartButton from '@/components/AddToCartButton';
import Price from '@/components/lux/Price';
import RainCanvas from '@/components/lux/RainCanvas';
import HeroGlass from '@/components/lux/HeroGlass';
import CollectionList from '@/components/lux/CollectionList';

/* ─────────────── Content ─────────────── */

const LINES = [
  { numeral: 'I', type: 'Wiper Blades', title: 'Wiper Blades', text: 'Frameless beam blades in pairs, for J-hook and U-hook arms.' },
  { numeral: 'II', type: 'Rain Repellent', title: 'Rain Repellent', text: 'A hydrophobic veil that makes rain bead and roll away at speed.' },
  { numeral: 'III', type: 'Washer Fluid', title: 'Washer Fluid', text: 'Concentrated tablets. One dissolves into four litres of streak-free fluid.' },
  { numeral: 'IV', type: 'Microfiber Towel', title: 'Microfiber', text: 'Waffle-weave towels that lift the last drop without a scratch.' },
];

const RITUAL = [
  { verb: 'Cleanse', type: 'Washer Fluid', text: 'Dissolve a single tablet in four litres of water. The glass is washed clean, without streaks and without plastic bottles.' },
  { verb: 'Repel', type: 'Rain Repellent', text: 'A fine hydrophobic coat. At speed, rain gathers into beads and simply leaves, so the wipers barely need to move.' },
  { verb: 'Sweep', type: 'Wiper Blades', text: 'Frameless beam blades glide silently across the curve of the glass, leaving one clean, unbroken arc.' },
  { verb: 'Dry', type: 'Microfiber Towel', text: 'A waffle-weave cloth of 400 GSM lifts the last drop and leaves the glass spotless.' },
];

const MANIFESTO =
  'Visibility is the first luxury of every journey. We gather the finest essentials for the glass between you and the road, so that every drive begins in perfect clarity.';
const GOLD_WORDS = new Set(['luxury', 'clarity.']);

const STEP_CLASSES = [
  'group-data-[step=0]/ritual:opacity-100 group-data-[step=0]/ritual:translate-y-0 group-data-[step=0]/ritual:blur-none',
  'group-data-[step=1]/ritual:opacity-100 group-data-[step=1]/ritual:translate-y-0 group-data-[step=1]/ritual:blur-none',
  'group-data-[step=2]/ritual:opacity-100 group-data-[step=2]/ritual:translate-y-0 group-data-[step=2]/ritual:blur-none',
  'group-data-[step=3]/ritual:opacity-100 group-data-[step=3]/ritual:translate-y-0 group-data-[step=3]/ritual:blur-none',
];
const ART_CLASSES = [
  'group-data-[step=0]/ritual:opacity-100 group-data-[step=0]/ritual:scale-100',
  'group-data-[step=1]/ritual:opacity-100 group-data-[step=1]/ritual:scale-100',
  'group-data-[step=2]/ritual:opacity-100 group-data-[step=2]/ritual:scale-100',
  'group-data-[step=3]/ritual:opacity-100 group-data-[step=3]/ritual:scale-100',
];
const DOT_CLASSES = [
  'group-data-[step=0]/ritual:bg-gold group-data-[step=0]/ritual:w-10',
  'group-data-[step=1]/ritual:bg-gold group-data-[step=1]/ritual:w-10',
  'group-data-[step=2]/ritual:bg-gold group-data-[step=2]/ritual:w-10',
  'group-data-[step=3]/ritual:bg-gold group-data-[step=3]/ritual:w-10',
];

/* ─────────────── Sections ─────────────── */

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-center overflow-hidden">
      {/* Cinematic ground: midnight light, two slow beams, rain, vignette */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(90% 70% at 70% 35%, #18213a 0%, #0b1020 38%, #07080b 75%)' }} />
        <div className="hero-fade absolute inset-0" style={{ '--d': '200ms' }}>
          <div
            className="absolute -top-1/4 left-[38%] h-[150%] w-[38vw] -rotate-[24deg] opacity-60 blur-2xl"
            style={{ background: 'linear-gradient(180deg, #f1dfb81f, transparent 70%)', animation: 'drift 14s ease-in-out infinite' }}
          />
          <div
            className="absolute -top-1/4 left-[62%] h-[150%] w-[14vw] -rotate-[24deg] opacity-50 blur-xl"
            style={{ background: 'linear-gradient(180deg, #c9cdd41a, transparent 65%)', animation: 'drift 11s ease-in-out infinite reverse' }}
          />
        </div>
        <div className="hero-fade absolute inset-0 opacity-80" style={{ '--d': '300ms' }}>
          <RainCanvas />
        </div>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, #07080b 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-obsidian" />
      </div>

      <div className="container-page grid items-center gap-14 pb-28 pt-32 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 lg:pt-24">
        <div className="relative z-10">
          <p className="eyebrow hero-in max-sm:tracking-[0.24em]" style={{ '--d': '0ms' }}>Category 82 · Windshield Care &amp; Wiper Blades</p>
          <h1 id="hero-title" className="display mt-8 text-[clamp(4.2rem,11.5vw,11rem)] text-ivory">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="hero-in block" style={{ '--d': '120ms' }}>Clarity,</span>
            </span>
            <span className="block overflow-hidden pb-[0.08em] pl-[0.55em]">
              <span className="hero-in gold-text block italic" style={{ '--d': '260ms' }}>redefined.</span>
            </span>
          </h1>
          <p className="hero-in mt-10 max-w-md text-[17px] leading-[1.75] text-mute" style={{ '--d': '420ms' }}>
            The quiet art of the immaculate windshield. Blades, veils, tablets and cloths, chosen for the
            glass between you and the road.
          </p>
          <div className="hero-in mt-12 flex flex-wrap items-center gap-5" style={{ '--d': '560ms' }}>
            <Link href="/products" data-magnetic className="btn-primary h-14 px-9">
              Enter the collection <span aria-hidden="true">→</span>
            </Link>
            <Link href="#ritual" data-magnetic className="btn-secondary h-14 px-8">
              Discover the ritual
            </Link>
          </div>
        </div>

        <div className="hero-fade relative" style={{ '--d': '350ms' }}>
          <div data-parallax="0.08">
            <HeroGlass />
          </div>
        </div>
      </div>

      {/* Scroll cue + quiet facts */}
      <div className="hero-fade absolute inset-x-0 bottom-8" style={{ '--d': '900ms' }}>
        <div className="container-page flex items-end justify-between text-[10px] uppercase tracking-[0.34em] text-dim">
          <p className="hidden sm:block">Free delivery from ₹999 · Cash on delivery</p>
          <a href="#manifesto" className="flex flex-col items-center gap-3 text-mute hover:text-gold-light">
            Scroll
            <span className="block h-12 w-px overflow-hidden bg-line">
              <span className="block h-full w-full bg-gold" style={{ animation: 'scroll-cue 2.4s cubic-bezier(.65,0,.35,1) infinite' }} />
            </span>
          </a>
          <p className="hidden sm:block">Est. 2026</p>
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  const words = MANIFESTO.split(' ');
  return (
    <section id="manifesto" aria-label="Manifesto" className="relative py-40 sm:py-56">
      <div className="container-page grid gap-12 lg:grid-cols-[220px_1fr]">
        <p className="eyebrow pt-4" data-reveal>Manifesto</p>
        <div data-progress="through" style={{ '--p': 0 }}>
          <p className="display text-[clamp(2.2rem,4.6vw,4.6rem)] leading-[1.12] text-ivory">
            {words.map((w, i) => (
              <span
                key={i}
                className={GOLD_WORDS.has(w) ? 'gold-text italic' : undefined}
                style={{
                  opacity: `clamp(0.14, calc((var(--p) * 1.35 - ${(i / words.length).toFixed(3)}) * 9), 1)`,
                  transition: 'opacity 0.2s linear',
                }}
              >
                {w}{' '}
              </span>
            ))}
          </p>
          <div className="mt-16 flex items-center gap-6" data-reveal>
            <span className="h-px w-16 bg-gold/60" />
            <span className="text-[11px] uppercase tracking-[0.34em] text-dim">The house of AutoCare</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ['Wiper Blades', 'Rain Repellent', 'Washer Fluid', 'Microfiber', 'Clarity'];
  const row = [...items, ...items, ...items, ...items];
  return (
    <div aria-hidden="true" className="relative overflow-hidden border-y border-line py-8">
      <div className="flex w-max items-center gap-14 whitespace-nowrap" style={{ animation: 'marquee 48s linear infinite' }}>
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-14">
            <span className={`display text-5xl italic sm:text-6xl ${i % 5 === 4 ? 'gold-text' : 'text-ivory/80'}`}>{t}</span>
            <span className="text-gold/60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

async function Collection() {
  const { products } = await serverApi('/products?limit=100');
  const lines = LINES.map((l) => {
    const ps = products.filter((p) => p.type === l.type);
    const prices = ps.map((p) => p.price);
    return {
      ...l,
      count: ps.length,
      range: prices.length ? `${formatPrice(Math.min(...prices))} — ${formatPrice(Math.max(...prices))}` : 'Coming soon',
    };
  });
  return <CollectionList lines={lines} />;
}

function CollectionSection() {
  return (
    <section aria-labelledby="collection-title" className="relative py-36">
      <div className="container-page">
        <div className="mb-20 flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow" data-reveal>The collection</p>
            <h2 id="collection-title" className="display mt-6 text-[clamp(3rem,7vw,7rem)] text-ivory" data-reveal="line">
              <span>Four <em className="gold-text">essentials.</em></span>
            </h2>
          </div>
          <Link href="/products" className="link-lux" data-reveal>View every piece →</Link>
        </div>
        <Suspense fallback={<div className="h-[520px] animate-pulse rounded-2xl border border-line" />}>
          <Collection />
        </Suspense>
      </div>
    </section>
  );
}

function Ritual() {
  return (
    <section
      id="ritual"
      aria-labelledby="ritual-title"
      data-progress="sticky"
      data-steps="4"
      data-step="0"
      className="group/ritual relative h-[420vh]"
      style={{ '--p': 0 }}
    >
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(70% 60% at 75% 50%, #141b30 0%, #07080b 70%)' }} />
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">The ritual</p>
            <h2 id="ritual-title" className="sr-only">The ritual: cleanse, repel, sweep, dry</h2>
            <div className="relative mt-8 h-[300px] sm:h-[340px]">
              {RITUAL.map((r, i) => (
                <div
                  key={r.verb}
                  className={`absolute inset-0 translate-y-6 opacity-0 blur-sm transition-all duration-1000 ease-[cubic-bezier(.22,1,.36,1)] ${STEP_CLASSES[i]}`}
                >
                  <p className="text-[11px] uppercase tracking-[0.34em] text-dim">Chapter 0{i + 1} / 04</p>
                  <h3 className="display mt-4 text-[clamp(4rem,10vw,9rem)] italic text-ivory">{r.verb}</h3>
                  <p className="mt-6 max-w-md text-[16px] leading-[1.8] text-mute">{r.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-3" aria-hidden="true">
              {RITUAL.map((r, i) => (
                <span key={r.verb} className={`h-px w-5 bg-line-strong transition-all duration-700 ${DOT_CLASSES[i]}`} />
              ))}
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <div aria-hidden="true" className="absolute inset-0 rounded-full border border-line" />
            <div aria-hidden="true" className="absolute inset-[6%] rounded-full border border-gold/20" />
            <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="49.6" fill="none" stroke="#d4b27a" strokeWidth="0.4" pathLength="1" strokeDasharray="1" style={{ strokeDashoffset: 'calc(1 - var(--p))' }} />
            </svg>
            {RITUAL.map((r, i) => (
              <div
                key={r.verb}
                className={`absolute inset-[12%] scale-90 overflow-hidden rounded-full opacity-0 transition-all duration-1000 ease-[cubic-bezier(.22,1,.36,1)] ${ART_CLASSES[i]}`}
              >
                <ProductArt product={{ type: r.type, name: r.verb }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

async function SignatureProduct() {
  let product = null;
  try {
    ({ product } = await serverApi('/products/universal-hook-type-wiper-blade-pair-20-26'));
  } catch {
    const { products } = await serverApi('/products?q=Wiper%20Blades&sort=price_desc&limit=1');
    product = products[0];
  }
  if (!product) return null;

  return (
    <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
      <div data-reveal="mask" className="relative">
        <div data-tilt="7" className="group relative [perspective:1200px]" style={{ '--rx': '0deg', '--ry': '0deg', '--mx': '50%', '--my': '50%' }}>
          <div
            className="relative aspect-[4/3.4] overflow-hidden rounded-[28px] border border-line transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
            style={{ transform: 'rotateX(var(--rx)) rotateY(var(--ry))' }}
          >
            <ProductArt product={product} />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              style={{ background: 'radial-gradient(400px circle at var(--mx) var(--my), #f1dfb826, transparent 60%)' }}
            />
          </div>
        </div>
      </div>

      <div>
        <p className="eyebrow" data-reveal>Signature piece</p>
        <h2 id="signature-title" className="display mt-6 text-[clamp(2.8rem,5vw,5rem)] text-ivory" data-reveal style={{ '--delay': '100ms' }}>
          {product.name.replace('Universal ', '')}
        </h2>
        <p className="mt-8 max-w-lg text-[16px] leading-[1.8] text-mute" data-reveal style={{ '--delay': '200ms' }}>
          {product.description}
        </p>
        <dl className="mt-10 border-t border-line" data-reveal style={{ '--delay': '300ms' }}>
          {product.features?.map((f, i) => (
            <div key={f} className="flex items-baseline justify-between gap-6 border-b border-line py-4">
              <dt className="text-[11px] uppercase tracking-[0.3em] text-dim">0{i + 1}</dt>
              <dd className="text-right text-[15px] text-ivory">{f}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 flex flex-wrap items-center gap-8" data-reveal style={{ '--delay': '400ms' }}>
          <Price value={product.price} className="text-6xl text-gold-light" />
          {product.stock > 0 ? <AddToCartButton product={product} /> : <p className="text-sm text-rose-300">Currently unavailable</p>}
        </div>
        <Link href={`/products/${product.slug}`} className="link-lux mt-8" data-reveal style={{ '--delay': '500ms' }}>
          The full details →
        </Link>
      </div>
    </div>
  );
}

function Signature() {
  return (
    <section id="signature" aria-labelledby="signature-title" className="relative py-36 sm:py-48">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(50% 50% at 25% 50%, #d4b27a14, transparent 70%)' }} />
      <div className="container-page">
        <Suspense fallback={<div className="h-[560px] animate-pulse rounded-[28px] border border-line" />}>
          <SignatureProduct />
        </Suspense>
      </div>
    </section>
  );
}

function Assurances() {
  const items = [
    ['4 L', 'of streak-free fluid from a single tablet'],
    ['3 mo', 'of rain repellency from one application'],
    ['16–26″', 'blade pairs for hatchbacks to SUVs'],
    ['₹999', 'and above, delivered free of charge'],
  ];
  return (
    <section aria-label="Assurances" className="border-y border-line">
      <div className="container-page grid sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([n, t], i) => (
          <div
            key={n}
            data-reveal
            style={{ '--delay': `${i * 120}ms` }}
            className={`py-14 sm:px-8 ${i > 0 ? 'border-t border-line sm:border-t-0' : ''} ${i % 2 === 1 ? 'sm:border-l sm:border-line' : ''} ${i >= 2 ? 'sm:border-t lg:border-t-0' : ''} ${i > 0 ? 'lg:border-l lg:border-line' : ''}`}
          >
            <p className="display gold-text text-6xl">{n}</p>
            <p className="mt-4 max-w-[220px] text-[14px] leading-relaxed text-mute">{t}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Marquee />
      <CollectionSection />
      <Ritual />
      <Signature />
      <Assurances />
    </>
  );
}
