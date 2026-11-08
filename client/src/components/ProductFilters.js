'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const types = ['Wiper Blades', 'Rain Repellent', 'Washer Fluid', 'Microfiber Towel', 'Kit'];

export default function ProductFilters({ categories }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');

  function update(changes) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete('page');
    const qs = next.toString();
    router.push(qs ? `/products?${qs}` : '/products', { scroll: false });
  }

  const activeType = types.includes(params.get('q')) ? params.get('q') : '';
  const chip = (active) =>
    `h-10 rounded-full border px-5 text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 ${
      active ? 'border-accent bg-accent/15 text-accent-light' : 'border-line text-mute hover:border-line-strong hover:text-frost'
    }`;

  return (
    <div className="glass flex flex-col gap-5 rounded-[22px] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Product type" className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={!activeType && !params.get('q')}
          onClick={() => {
            setQ('');
            update({ q: '' });
          }}
          className={chip(!activeType && !params.get('q'))}
        >
          All
        </button>
        {types.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={activeType === t}
            onClick={() => {
              const v = activeType === t ? '' : t;
              setQ(v);
              update({ q: v });
            }}
            className={chip(activeType === t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: q.trim() });
          }}
          className="relative"
        >
          <label htmlFor="search" className="sr-only">Search the collection</label>
          <input
            id="search"
            className="input h-10 rounded-full py-0 pr-12 sm:w-64"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search — e.g. 22 inch"
          />
          <button type="submit" aria-label="Search" className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full text-accent hover:bg-accent/10">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          </button>
        </form>
        {categories.length > 1 && (
          <>
            <label htmlFor="category" className="sr-only">Category</label>
            <select id="category" className="input h-10 rounded-full py-0 sm:w-56" value={params.get('category') || ''} onChange={(e) => update({ category: e.target.value })}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>{c.number ? `${c.number}. ` : ''}{c.name}</option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="sort" className="sr-only">Sort by</label>
        <select id="sort" className="input h-10 rounded-full py-0 sm:w-52" value={params.get('sort') || 'newest'} onChange={(e) => update({ sort: e.target.value })}>
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>
    </div>
  );
}
