import Link from 'next/link';
import { Suspense } from 'react';
import { serverApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import ProductArt from '@/components/ProductArt';
import HeroWindshield from '@/components/vision/HeroWindshield';
import StoryChapters from '@/components/vision/StoryChapters';
import WeatherSimulator from '@/components/vision/WeatherSimulator';
import { FitTeaser, AssistantPrompts } from '@/components/vision/HomeWidgets';

const STATEMENT =
  'The windshield is the most important screen in your car. We engineer everything that keeps it clear, in every season and every storm.';
const LIT = new Set(['screen', 'clear,']);

const LINES = [
  { type: 'Wiper Blades', title: 'Beam wiper blades', text: 'Frameless pairs for J-hook and U-hook arms.' },
  { type: 'Rain Repellent', title: 'Rain repellent', text: 'A hydrophobic coat that makes rain bead and run off.' },
  { type: 'Washer Fluid', title: 'Washer fluid', text: 'Concentrated tablets: one makes four litres.' },
  { type: 'Microfiber Towel', title: 'Microfiber care', text: 'Waffle-weave cloths for a spotless finish.' },
];

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-black">
      <HeroWindshield />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, #050608cc 0%, transparent 22%, transparent 45%, #050608e6 88%, #050608 100%)' }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 sm:hidden" style={{ background: 'linear-gradient(180deg, transparent 20%, #050608b3 45%, #050608d9 100%)' }} />
      <div className="container-page relative z-10 pb-24 pt-40">
        <p className="eyebrow hero-in max-sm:tracking-[0.2em]" style={{ '--d': '0ms' }}>Category 82 · Windshield care &amp; wiper blades</p>
        <h1 id="hero-title" className="display mt-6 text-[clamp(4rem,11vw,11rem)]">
          <span className="block overflow-hidden pb-[0.04em]"><span className="hero-in chrome-text block" style={{ '--d': '120ms' }}>Visibility,</span></span>
          <span className="block overflow-hidden pb-[0.06em]"><span className="hero-in accent-text block" style={{ '--d': '240ms' }}>engineered.</span></span>
        </h1>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <p className="hero-in max-w-md text-[17px] leading-[1.75] text-silver" style={{ '--d': '380ms' }}>
            Precision wiper blades, rain repellent and glass care, plus the tools to see exactly what each one does for your view of the road.
          </p>
          <div className="hero-in flex flex-wrap gap-4" style={{ '--d': '500ms' }}>
            <Link href="/simulator" data-magnetic className="btn-primary h-14 px-9">Enter the simulator</Link>
            <Link href="/fit" data-magnetic className="btn-secondary h-14 px-8">Find your blades</Link>
          </div>
        </div>
      </div>
      <a href="#statement" className="hero-fade hud absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 sm:flex flex-col items-center gap-3 hover:text-ice" style={{ '--d': '900ms' }}>
        Scroll
        <span className="block h-10 w-px overflow-hidden bg-line">
          <span className="block h-full w-full bg-accent-light" style={{ animation: 'scroll-cue 2.4s cubic-bezier(.65,0,.35,1) infinite' }} />
        </span>
      </a>
    </section>
  );
}

function Statement() {
  const words = STATEMENT.split(' ');
  return (
    <section id="statement" aria-label="Our approach" className="py-40 sm:py-56">
      <div className="container-page grid gap-12 lg:grid-cols-[220px_1fr]">
        <p className="eyebrow pt-4" data-reveal>Our approach</p>
        <div data-progress="through" style={{ '--p': 0 }}>
          <p className="display text-[clamp(2.2rem,4.8vw,4.8rem)] leading-[1.08]">
            {words.map((w, i) => (
              <span
                key={i}
                className={LIT.has(w) ? 'accent-text' : 'text-frost'}
                style={{ opacity: `clamp(0.12, calc((var(--p) * 1.35 - ${(i / words.length).toFixed(3)}) * 9), 1)`, transition: 'opacity 0.2s linear' }}
              >
                {w}{' '}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

async function Anatomy() {
  const { products } = await serverApi('/products?limit=100').catch(() => ({ products: [] }));
  const byType = (t) => products.filter((p) => p.type === t);
  const blades = byType('Wiper Blades').filter((p) => p.bladeLengthsIn?.length === 2);
  const allSizes = blades.flatMap((p) => p.bladeLengthsIn);
  const largest = [...blades].sort((a, b) => Math.max(...b.bladeLengthsIn) - Math.max(...a.bladeLengthsIn))[0];
  const featuresOf = (t) => (byType(t)[0]?.features || []).slice(0, 3);
  const chapters = [
    {
      verb: 'Sweep', line: 'Wiper blades', type: 'Wiper Blades', lengths: largest?.bladeLengthsIn || [], href: '/products?q=Wiper%20Blades',
      text: 'Frameless beam blades follow the curve of the glass, pressing evenly along their length for one clean, quiet arc.',
      facts: allSizes.length ? [`Pairs from ${Math.min(...allSizes)}″ to ${Math.max(...allSizes)}″`, ...featuresOf('Wiper Blades').slice(0, 2)] : featuresOf('Wiper Blades'),
    },
    { verb: 'Repel', line: 'Rain repellent', type: 'Rain Repellent', href: '/products?q=Rain%20Repellent', text: 'A hydrophobic coat. At speed, rain gathers into beads and simply leaves, so the wipers barely need to move.', facts: featuresOf('Rain Repellent') },
    { verb: 'Cleanse', line: 'Washer fluid', type: 'Washer Fluid', href: '/products?q=Washer%20Fluid', text: 'Concentrated effervescent tablets dissolve into streak-free washer fluid. No bulky bottles.', facts: featuresOf('Washer Fluid') },
    { verb: 'Finish', line: 'Microfiber care', type: 'Microfiber Towel', href: '/products?q=Microfiber%20Towel', text: 'Waffle-weave microfiber lifts the last drop and leaves the glass spotless, inside and out.', facts: featuresOf('Microfiber Towel') },
  ];
  return <StoryChapters chapters={chapters} />;
}

function SimulatorSection() {
  return (
    <section aria-labelledby="sim-title" className="py-36">
      <div className="container-page">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow" data-reveal>Weather simulator</p>
            <h2 id="sim-title" className="display mt-6 text-[clamp(3rem,7vw,7rem)]" data-reveal="line">
              <span><span className="chrome-text">Test the</span> <span className="accent-text">weather.</span></span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-[1.8] text-mute" data-reveal>
            Turn up the rain, switch off the wipers, wear out the blades. Then see what a fresh blade and a repellent coat change.
          </p>
        </div>
        <div data-reveal>
          <WeatherSimulator compact />
        </div>
        <Link href="/simulator" className="link-tech mt-8">Open the full simulator →</Link>
      </div>
    </section>
  );
}

function FitSection() {
  return (
    <section aria-labelledby="fit-title" className="relative overflow-hidden border-y border-line py-36">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(50% 70% at 85% 50%, #2f8cff17, transparent 70%)' }} />
      <div className="container-page grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow" data-reveal>Compatibility finder</p>
          <h2 id="fit-title" className="display mt-6 text-[clamp(3rem,6.5vw,6.5rem)]" data-reveal="line">
            <span><span className="chrome-text">Exactly your</span> <span className="accent-text">fit.</span></span>
          </h2>
          <p className="mt-8 max-w-lg text-[16px] leading-[1.8] text-mute" data-reveal>
            Search by vehicle, where each record is verified against a cited source, or enter the lengths of your current blades. We only recommend pairs whose recorded sizes match, and we tell you why.
          </p>
          <ul className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3" data-reveal>
            {['Verified sources', 'Exact & close matches', 'Connector check'].map((t) => (
              <li key={t} className="rounded-2xl border border-line px-4 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-silver">{t}</li>
            ))}
          </ul>
        </div>
        <div data-reveal style={{ '--delay': '150ms' }}>
          <FitTeaser />
        </div>
      </div>
    </section>
  );
}

async function Lines() {
  const { products } = await serverApi('/products?limit=100').catch(() => ({ products: [] }));
  return (
    <div className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {LINES.map((l, i) => {
        const ps = products.filter((p) => p.type === l.type);
        const prices = ps.map((p) => p.price);
        return (
          <Link
            key={l.type}
            href={`/products?q=${encodeURIComponent(l.type)}`}
            data-cursor="View"
            data-reveal
            style={{ '--delay': `${i * 100}ms` }}
            className="group relative flex flex-col bg-obsidian p-6 transition-colors duration-500 hover:bg-carbon"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line">
              <div className="h-full w-full transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105">
                <ProductArt product={{ type: l.type, name: l.title }} />
              </div>
            </div>
            <p className="hud mt-6">0{i + 1}{ps.length ? ` · ${ps.length} products` : ''}</p>
            <h3 className="mt-3 text-[24px] font-normal tracking-[-0.02em] text-frost">{l.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-mute">{l.text}</p>
            <p className="mt-6 font-mono text-[12px] text-ice">{prices.length ? `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}` : 'View range →'}</p>
          </Link>
        );
      })}
    </div>
  );
}

function LinesSection() {
  return (
    <section aria-labelledby="lines-title" className="py-36">
      <div className="container-page">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="eyebrow" data-reveal>The range</p>
            <h2 id="lines-title" className="display mt-6 text-[clamp(3rem,7vw,7rem)]" data-reveal="line">
              <span><span className="chrome-text">Four systems.</span> <span className="accent-text">One view.</span></span>
            </h2>
          </div>
          <Link href="/products" className="link-tech" data-reveal>All products →</Link>
        </div>
        <Suspense fallback={<div className="h-[440px] animate-pulse rounded-[28px] border border-line" />}>
          <Lines />
        </Suspense>
      </div>
    </section>
  );
}

function AssistantSection() {
  return (
    <section aria-labelledby="assist-title" className="pb-12 pt-20">
      <div className="container-page">
        <div className="glass relative overflow-hidden rounded-[32px] p-8 sm:p-14">
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl" style={{ background: '#2f8cff33' }} />
          <p className="eyebrow" data-reveal>Care assistant</p>
          <h2 id="assist-title" className="display mt-6 max-w-3xl text-[clamp(2.6rem,5.5vw,5.5rem)]" data-reveal="line">
            <span><span className="chrome-text">Ask anything about</span> <span className="accent-text">your glass.</span></span>
          </h2>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.8] text-mute" data-reveal>
            Streaks, chatter, fogging, washer trouble or which product to choose. The assistant troubleshoots step by step and only recommends products we actually stock.
          </p>
          <div className="mt-10" data-reveal>
            <AssistantPrompts prompts={['My wipers leave streaks', 'Wipers chatter on the glass', 'When should I replace blades?', 'Prepare for the monsoon']} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Statement />
      <Suspense fallback={<div className="h-[100svh]" />}>
        <Anatomy />
      </Suspense>
      <SimulatorSection />
      <FitSection />
      <LinesSection />
      <AssistantSection />
    </>
  );
}
