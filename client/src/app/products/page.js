import Link from 'next/link';
import { Suspense } from 'react';
import { serverApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { ProductGridSkeleton } from '@/components/Skeletons';

export const metadata = { title: 'Products' };

const ALLOWED = ['q', 'category', 'sort', 'page', 'minPrice', 'maxPrice'];

function toQuery(sp) {
  const qs = new URLSearchParams();
  for (const key of ALLOWED) {
    const v = sp[key];
    if (typeof v === 'string' && v) qs.set(key, v);
  }
  return qs;
}

async function Filters() {
  const { categories } = await serverApi('/categories');
  return <ProductFilters categories={categories} />;
}

async function Results({ searchParams }) {
  const sp = await searchParams;
  const qs = toQuery(sp);
  qs.set('limit', '12');
  const { products, total, page, pages } = await serverApi(`/products?${qs.toString()}`);

  const pageHref = (n) => {
    const next = toQuery(sp);
    next.set('page', String(n));
    return `/products?${next.toString()}`;
  };

  return (
    <>
      <p className="hud mb-12" aria-live="polite">
        {total} {total === 1 ? 'product' : 'products'}
        {sp.q ? <> · <span className="text-accent-light">“{sp.q}”</span></> : null}
      </p>
      {products.length === 0 ? (
        <div className="flex flex-col items-start gap-6 border-y border-line py-24">
          <p className="display chrome-text text-5xl">No match found.</p>
          <p className="max-w-md text-mute">Try another search, or return to the full collection.</p>
          <Link href="/products" className="btn-secondary">View everything</Link>
        </div>
      ) : (
        <div className="grid gap-x-8 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <div key={p._id}>
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-32 flex justify-center gap-3" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`grid h-12 w-12 place-items-center rounded-full border text-sm tabular-nums transition-colors ${n === page ? 'border-accent bg-accent/15 text-accent-light' : 'border-line text-mute hover:border-line-strong hover:text-frost'}`}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

export default function ProductsPage({ searchParams }) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[620px]" style={{ background: 'radial-gradient(70% 80% at 80% 0%, #0c1726 0%, #050608 70%)' }} />
      <div className="container-page pb-16 pt-40 sm:pt-48">
        <div className="mb-16 grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow animate-rise">Products</p>
            <h1 className="display mt-6 text-[clamp(3.4rem,8.5vw,8.5rem)]">
              <span className="chrome-text block animate-rise [animation-delay:120ms]">Precision for</span>
              <span className="accent-text block animate-rise [animation-delay:240ms]">every surface.</span>
            </h1>
          </div>
          <p className="max-w-sm animate-rise text-[15px] leading-[1.8] text-mute [animation-delay:360ms]">
            Search, filter and compare blades, repellent, washer fluid and microfiber care. Not sure about sizes? <Link href="/fit" className="text-ice underline decoration-accent/50 underline-offset-4">Find your fit</Link>.
          </p>
        </div>
        <div className="animate-rise [animation-delay:420ms]">
          <Suspense fallback={<div className="glass h-[74px] animate-pulse rounded-[22px]" />}>
            <Filters />
          </Suspense>
        </div>
        <section aria-label="Products" className="mt-14">
          <Suspense fallback={<ProductGridSkeleton count={6} />}>
            <Results searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
