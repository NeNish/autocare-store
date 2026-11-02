import Link from 'next/link';
import { Suspense } from 'react';
import { serverApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';

const highlights = [
  { title: 'Washer fluid tablets', text: 'One tablet makes 4 litres of streak-free fluid.', q: 'tablets' },
  { title: 'Rain-repellent sprays', text: 'Rain beads off the glass at highway speeds.', q: 'rain' },
  { title: 'Microfiber towels', text: 'Waffle-weave towels for a spot-free dry.', q: 'microfiber' },
  { title: 'Hook-type wiper blades', text: 'Universal pairs that fit J-hook and U-hook arms.', q: 'wiper' },
];

async function Categories() {
  const { categories } = await serverApi('/categories');
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {categories.map((c) => (
        <Link key={c._id} href={`/products?category=${c.slug}`} className="card p-5 hover:border-brand">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category {c.number}</p>
          <h3 className="mt-1 text-lg font-semibold">{c.name}</h3>
          <p className="mt-2 text-sm text-slate-600">{c.description}</p>
          <p className="mt-3 text-sm font-medium text-brand">{c.productCount} products →</p>
        </Link>
      ))}
    </div>
  );
}

async function Featured() {
  const { products } = await serverApi('/products?limit=4&sort=newest');
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-br from-ink to-brand-dark text-white">
        <div className="container-page grid gap-8 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Windshield care</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">See every road clearly, rain or shine.</h1>
            <p className="mt-4 max-w-md text-white/80">
              Washer fluid tablets, rain-repellent sprays, drying towels and universal wiper blades, all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn bg-accent text-ink hover:bg-amber-400">Shop all products</Link>
              <Link href="/products?q=wiper" className="btn border border-white/30 text-white hover:bg-white/10">
                Find wiper blades
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            {highlights.map((h) => (
              <Link key={h.title} href={`/products?q=${h.q}`} className="rounded-xl bg-white/10 p-4 hover:bg-white/15">
                <p className="font-semibold">{h.title}</p>
                <p className="mt-1 text-sm text-white/70">{h.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-12">
        <h2 className="mb-4 text-2xl font-bold">Shop by category</h2>
        <Suspense fallback={<div className="card h-36 animate-pulse" />}>
          <Categories />
        </Suspense>
      </section>

      <section className="container-page mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">New arrivals</h2>
          <Link href="/products" className="text-sm font-medium text-brand hover:underline">View all</Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <Featured />
        </Suspense>
      </section>

      <section className="container-page mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ['Free shipping', 'On orders of ₹999 or more'],
          ['Easy returns', 'Within 7 days of delivery'],
          ['Fits most cars', 'Universal hook-type adapters'],
        ].map(([t, d]) => (
          <div key={t} className="card p-5">
            <p className="font-semibold">{t}</p>
            <p className="text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
