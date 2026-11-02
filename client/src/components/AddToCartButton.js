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
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (compact) {
    return (
      <button type="button" onClick={handleAdd} disabled={maxMore < 1} className="btn-primary px-3 py-2">
        {added ? 'Added ✓' : 'Add'}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="sr-only" htmlFor="qty">Quantity</label>
      <select
        id="qty"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        className="input w-20"
        disabled={maxMore < 1}
      >
        {Array.from({ length: Math.max(1, Math.min(maxMore, 10)) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <button type="button" onClick={handleAdd} disabled={maxMore < 1} className="btn-primary min-w-40">
        {added ? 'Added to cart ✓' : maxMore < 1 ? 'Max in cart' : 'Add to cart'}
      </button>
    </div>
  );
}
