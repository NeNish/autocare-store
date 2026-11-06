'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import useHydrated from '@/lib/useHydrated';

export default function AddToCartButton({ product, compact = false }) {
  const { add, items } = useCart();
  const hydrated = useHydrated();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = !hydrated ? 0 : items.find((i) => i.productId === product._id)?.quantity || 0;
  const maxMore = Math.max(0, Math.min(product.stock, 99) - inCart);

  function handleAdd() {
    add(product, compact ? 1 : qty);
    setQty(1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={maxMore < 1}
        aria-label={`Add ${product.name} to bag`}
        className="link-lux disabled:opacity-40"
      >
        <span aria-live="polite">{added ? 'Added ✓' : maxMore < 1 ? 'In bag' : 'Add to bag'}</span>
      </button>
    );
  }

  const max = Math.max(1, Math.min(maxMore, 10));
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex h-14 items-center rounded-full border border-line-strong">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1 || maxMore < 1}
          aria-label="Decrease quantity"
          className="grid h-14 w-12 place-items-center text-lg text-mute transition-colors hover:text-gold-light disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center text-[15px] tabular-nums text-ivory" aria-live="polite" aria-label={`Quantity ${qty}`}>
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          disabled={qty >= max || maxMore < 1}
          aria-label="Increase quantity"
          className="grid h-14 w-12 place-items-center text-lg text-mute transition-colors hover:text-gold-light disabled:opacity-30"
        >
          +
        </button>
      </div>
      <button type="button" onClick={handleAdd} disabled={maxMore < 1} data-magnetic="0.25" className="btn-primary h-14 min-w-52 px-9">
        <span aria-live="polite">{added ? 'Added to bag ✓' : maxMore < 1 ? 'All in your bag' : 'Add to bag'}</span>
      </button>
    </div>
  );
}
