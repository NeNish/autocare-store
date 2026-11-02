'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import useHydrated from '@/lib/useHydrated';
import ProductArt from '@/components/ProductArt';
import OrderSummary from '@/components/OrderSummary';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { items, ready, subtotal, setQuantity, remove } = useCart();
  const hydrated = useHydrated();

  if (!ready || !hydrated) return <p className="py-16 text-center text-slate-500">Loading cart…</p>;

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-slate-600">Add some windshield care essentials to get started.</p>
        <Link href="/products" className="btn-primary mt-6">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.productId} className="card flex gap-4 p-4">
              <Link href={`/products/${item.slug}`} className="h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                <ProductArt product={item} />
              </Link>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <Link href={`/products/${item.slug}`} className="font-medium hover:text-brand">{item.name}</Link>
                  <p className="text-sm text-slate-500">{formatPrice(item.price)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg ring-1 ring-slate-300">
                    <button
                      className="px-3 py-1.5 disabled:opacity-40"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
                    <button
                      className="px-3 py-1.5 disabled:opacity-40"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= Math.min(item.stock, 99)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="w-20 text-right font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  <button onClick={() => remove(item.productId)} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <OrderSummary subtotal={subtotal}>
          <Link href="/checkout" className="btn-primary w-full">Proceed to checkout</Link>
        </OrderSummary>
      </div>
    </div>
  );
}
