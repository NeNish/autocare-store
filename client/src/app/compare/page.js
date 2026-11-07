'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCompare } from '@/context/CompareContext';
import { clientApi } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import useHydrated from '@/lib/useHydrated';
import ProductArt from '@/components/ProductArt';
import AddToCartButton from '@/components/AddToCartButton';

// Rows come only from data stored for each product: nothing is inferred.
const ROWS = [
  ['Product line', (p) => p.type || '—'],
  ['Price', (p) => formatPrice(p.price)],
  ['Blade lengths', (p) => (p.bladeLengthsIn?.length ? p.bladeLengthsIn.map((n) => `${n}″`).join(' + ') : '—')],
  ['Connectors', (p) => (p.connectors?.length ? p.connectors.join(' / ') : '—')],
  ['Availability', (p) => (p.stock < 1 ? 'Out of stock' : p.stock <= 10 ? `Only ${p.stock} left` : 'In stock')],
];

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const hydrated = useHydrated();
  const [products, setProducts] = useState(null);
  const slugs = hydrated ? items.map((i) => i.slug).join(',') : null;

  useEffect(() => {
    if (!slugs) return;
    let live = true;
    Promise.all(slugs.split(',').map((s) => clientApi(`/products/${encodeURIComponent(s)}`).then((d) => d.product).catch(() => null))).then(
      (list) => live && setProducts(list.filter(Boolean))
    );
    return () => {
      live = false;
    };
  }, [slugs]);

  // Nothing selected: no fetch needed
  const shown = slugs === '' ? [] : products;
  const maxFeatures = Math.max(0, ...(shown || []).map((p) => p.features?.length || 0));

  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[560px]" style={{ background: 'radial-gradient(60% 75% at 85% 0%, #0c1a30 0%, #050608 70%)' }} />
      <div className="container-page pb-16 pt-36 sm:pt-40">
        <header className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow animate-rise">Compare</p>
            <h1 className="display mt-6 animate-rise text-[clamp(3rem,7.5vw,7rem)] [animation-delay:120ms]">
              <span className="chrome-text">Side by</span> <span className="accent-text">side.</span>
            </h1>
          </div>
          {items.length > 0 && <button onClick={clear} className="link-tech">Clear comparison</button>}
        </header>

        {shown === null ? (
          <p className="hud">Loading…</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-start gap-6 border-t border-line pt-12">
            <p className="max-w-lg text-[17px] text-mute">Choose up to three products with the Compare button on any product to see their specifications side by side.</p>
            <Link href="/products" className="btn-primary">Browse products</Link>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <caption className="sr-only">Comparison of {shown.length} products</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[180px] align-bottom"><span className="sr-only">Specification</span></th>
                  {shown.map((p) => (
                    <th key={p._id} scope="col" className="px-3 pb-6 align-top font-normal">
                      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-line">
                        <ProductArt product={p} />
                      </div>
                      <Link href={`/products/${p.slug}`} className="mt-4 block text-[18px] leading-snug text-frost hover:text-ice">{p.name}</Link>
                      <button onClick={() => remove(p.slug)} className="hud mt-2 hover:text-frost">Remove</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn]) => (
                  <tr key={label} className="border-t border-line">
                    <th scope="row" className="hud py-4 pr-4 font-normal">{label}</th>
                    {shown.map((p) => <td key={p._id} className="px-3 py-4 text-[15px] text-frost">{fn(p)}</td>)}
                  </tr>
                ))}
                {Array.from({ length: maxFeatures }, (_, i) => (
                  <tr key={`f${i}`} className="border-t border-line">
                    <th scope="row" className="hud py-4 pr-4 font-normal">{i === 0 ? 'Features' : <span className="sr-only">Feature {i + 1}</span>}</th>
                    {shown.map((p) => <td key={p._id} className="px-3 py-4 text-[14px] text-silver">{p.features?.[i] || ''}</td>)}
                  </tr>
                ))}
                <tr className="border-t border-line">
                  <th scope="row"><span className="sr-only">Add to bag</span></th>
                  {shown.map((p) => (
                    <td key={p._id} className="px-3 py-6">{p.stock > 0 && <AddToCartButton product={p} compact />}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
