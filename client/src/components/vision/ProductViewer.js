'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ProductArt from '@/components/ProductArt';

const Product3D = dynamic(() => import('./Product3D'), {
  ssr: false,
  loading: () => <p className="hud absolute inset-0 grid place-items-center">Loading 3D model…</p>,
});

// Switch between the interactive 3D model, the technical drawing and a photo (if one exists).
export default function ProductViewer({ product }) {
  const views = [
    ['3d', '3D model'],
    ['drawing', 'Drawing'],
    ...(product.image ? [['photo', 'Photo']] : []),
  ];
  const [view, setView] = useState('3d');
  return (
    <div className="relative aspect-square overflow-hidden rounded-[28px] border border-line" style={{ background: 'radial-gradient(70% 70% at 50% 40%, #0e1a2b 0%, #050608 75%)' }}>
      {view === '3d' && <Product3D type={product.type} lengths={product.bladeLengthsIn} className="absolute inset-0" />}
      {view === 'drawing' && <ProductArt product={{ ...product, image: null }} />}
      {view === 'photo' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
      )}
      <div role="tablist" aria-label="Product view" className="glass absolute left-4 top-4 flex rounded-full p-1">
        {views.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`h-8 rounded-full px-3 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${view === id ? 'bg-accent text-white' : 'text-mute hover:text-frost'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {product.bladeLengthsIn?.length > 0 && (
        <div className="glass pointer-events-none absolute right-4 top-4 rounded-2xl px-4 py-3 text-right">
          <p className="hud">Blade lengths</p>
          <p className="mt-1 font-mono text-[15px] text-ice">{[...product.bladeLengthsIn].sort((a, b) => b - a).map((n) => `${n}″`).join(' + ')}</p>
        </div>
      )}
      {view === '3d' && <p className="hud pointer-events-none absolute bottom-16 left-4 hidden sm:block">Illustrative model</p>}
    </div>
  );
}
