'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const types = ['Wiper Blades', 'Washer Fluid', 'Rain Repellent', 'Microfiber Towel'];

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
    router.push(`/products?${next.toString()}`);
  }

  return (
    <aside className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() });
        }}
      >
        <label htmlFor="search" className="label">Search</label>
        <div className="flex gap-2">
          <input id="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 22 inch, tablets" />
          <button className="btn-primary px-3" type="submit">Go</button>
        </div>
      </form>

      <div>
        <p className="label">Category</p>
        <div className="flex flex-col gap-1">
          <FilterButton active={!params.get('category')} onClick={() => update({ category: '' })}>All categories</FilterButton>
          {categories.map((c) => (
            <FilterButton key={c._id} active={params.get('category') === c.slug} onClick={() => update({ category: c.slug })}>
              {c.number ? `${c.number}. ` : ''}{c.name}
            </FilterButton>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Product type</p>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          {types.map((t) => {
            const active = params.get('q') === t;
            return (
              <FilterButton
                key={t}
                active={active}
                onClick={() => {
                  setQ(active ? '' : t);
                  update({ q: active ? '' : t });
                }}
              >
                {t}
              </FilterButton>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="sort" className="label">Sort by</label>
        <select id="sort" className="input" value={params.get('sort') || 'newest'} onChange={(e) => update({ sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>

      {[...params.keys()].length > 0 && (
        <button
          className="text-sm font-medium text-brand hover:underline"
          onClick={() => {
            setQ('');
            router.push('/products');
          }}
        >
          Clear all filters
        </button>
      )}
    </aside>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-left text-sm ${active ? 'bg-brand text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 lg:ring-0'}`}
    >
      {children}
    </button>
  );
}
