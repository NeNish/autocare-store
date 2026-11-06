'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import useHydrated from '@/lib/useHydrated';
import ProductArt from '@/components/ProductArt';
import OrderSummary from '@/components/OrderSummary';
import PageShell from '@/components/lux/PageShell';
import { formatPrice } from '@/lib/format';

export default function CartPage() {
  const { items, ready, subtotal, setQuantity, remove } = useCart();
  const hydrated = useHydrated();

  if (!ready || !hydrated) {
    return <p className="pt-48 text-center text-[11px] uppercase tracking-[0.34em] text-dim">Opening your bag…</p>;
  }

  if (items.length === 0) {
    return (
      <PageShell eyebrow="Your bag" title="Quietly" accent="empty.">
        <div className="flex flex-col items-start gap-8 border-t border-line pt-12">
          <p className="max-w-md text-[17px] leading-[1.8] text-mute">
            Nothing has been chosen yet. Begin with the collection: four essentials for a windshield that stays immaculate.
          </p>
          <Link href="/products" data-magnetic className="btn-primary h-14 px-9">Enter the collection →</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Your bag"
      title="Selected"
      accent="pieces."
      aside={<p className="text-[11px] uppercase tracking-[0.3em] text-dim">{items.reduce((n, i) => n + i.quantity, 0)} items</p>}
    >
      <div className="grid gap-14 lg:grid-cols-[1fr_400px]">
        <ul className="border-t border-line">
          {items.map((item) => (
            <li key={item.productId} className="grid grid-cols-[96px_1fr] gap-6 border-b border-line py-8 sm:grid-cols-[140px_1fr] sm:gap-8">
              <Link href={`/products/${item.slug}`} data-cursor="View" className="block aspect-square overflow-hidden rounded-2xl border border-line">
                <ProductArt product={item} />
              </Link>
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  {item.type && <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{item.type}</p>}
                  <Link href={`/products/${item.slug}`} className="display mt-2 block text-2xl leading-tight text-ivory hover:text-gold-light">
                    {item.name}
                  </Link>
                  <p className="mt-2 text-[13px] text-dim">{formatPrice(item.price)} each</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex h-11 items-center rounded-full border border-line-strong">
                    <button
                      className="grid h-11 w-10 place-items-center text-mute transition-colors hover:text-gold-light disabled:opacity-30"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={`Decrease quantity of ${item.name}`}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">{item.quantity}</span>
                    <button
                      className="grid h-11 w-10 place-items-center text-mute transition-colors hover:text-gold-light disabled:opacity-30"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= Math.min(item.stock, 99)}
                      aria-label={`Increase quantity of ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <span className="w-24 text-right text-[15px] tabular-nums text-ivory">{formatPrice(item.price * item.quantity)}</span>
                  <button
                    onClick={() => remove(item.productId)}
                    className="text-[11px] uppercase tracking-[0.22em] text-dim transition-colors hover:text-rose-200"
                    aria-label={`Remove ${item.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <OrderSummary subtotal={subtotal}>
          <Link href="/checkout" data-magnetic="0.2" className="btn-primary h-14 w-full">Proceed to checkout</Link>
          <Link href="/products" className="link-lux mx-auto flex w-fit">Continue browsing</Link>
        </OrderSummary>
      </div>
    </PageShell>
  );
}
