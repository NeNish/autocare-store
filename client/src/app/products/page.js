import Link from 'next/link';
import { Suspense } from 'react';
import { serverApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import ProductFilters from '@/components/ProductFilters';
import { ProductGridSkeleton } from '@/components/Skeletons';

export const metadata = { title: 'Shop' };

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
      <p className="mb-4 text-sm text-slate-600">
        {total} product{total === 1 ? '' : 's'}
        {sp.q ? <> matching <strong>&ldquo;{sp.q}&rdquo;</strong></> : null}
      </p>
      {products.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold">No products found</p>
          <p className="mt-1 text-sm text-slate-600">Try a different search or clear the filters.</p>
          <Link href="/products" className="btn-secondary mt-4">Clear filters</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-8 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={pageHref(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`grid h-9 w-9 place-items-center rounded-md text-sm font-medium ${n === page ? 'bg-brand text-white' : 'bg-white ring-1 ring-slate-200 hover:bg-slate-50'}`}
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
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Shop</h1>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
          <Filters />
        </Suspense>
        <section>
          <Suspense fallback={<ProductGridSkeleton count={6} />}>
            <Results searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
