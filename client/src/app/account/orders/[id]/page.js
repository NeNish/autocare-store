'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import StatusBadge from '@/components/StatusBadge';
import PageShell from '@/components/lux/PageShell';
import Price from '@/components/lux/Price';
import { useAuth } from '@/context/AuthContext';
import { clientApi, errorMessage } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';

function OrderDetail() {
  const { id } = useParams();
  const placed = useSearchParams().get('placed') === '1';
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    clientApi(`/orders/${id}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  async function cancel() {
    if (!window.confirm('Cancel this order?')) return;
    setBusy(true);
    try {
      const d = await clientApi(`/orders/${id}/cancel`, { method: 'POST' });
      setOrder((o) => ({ ...o, status: d.order.status }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <p className="text-rose-200">{error}</p>;
  if (!order) return <p className="text-[11px] uppercase tracking-[0.34em] text-dim">Loading order…</p>;

  const isOwner = String(order.user?._id) === String(user?._id);
  const a = order.shippingAddress;

  return (
    <div className="space-y-12">
      {placed && (
        <div className="glass relative overflow-hidden rounded-[24px] p-8 sm:p-10">
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl" style={{ background: '#d4b27a33' }} />
          <p className="eyebrow">Confirmed</p>
          <p className="display mt-4 text-4xl text-ivory sm:text-5xl">Thank you. Your order is <em className="gold-text">placed.</em></p>
          <p className="mt-4 text-[15px] text-mute">We&apos;ll update its status here as it makes its way to you.</p>
        </div>
      )}
      {error && <p className="text-sm text-rose-200">{error}</p>}

      <div className="flex flex-wrap items-center gap-6 border-y border-line py-6">
        <div className="flex-1">
          <p className="font-mono text-[13px] tracking-[0.12em] text-gold">Order #{order._id.slice(-8).toUpperCase()}</p>
          <p className="mt-1 text-[14px] text-mute">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
        {isOwner && order.status === 'pending' && (
          <button onClick={cancel} disabled={busy} className="btn-danger h-11">
            {busy ? 'Cancelling…' : 'Cancel order'}
          </button>
        )}
      </div>

      <div className="grid gap-12 md:grid-cols-[1fr_320px]">
        <div>
          <ul className="border-t border-line">
            {order.items.map((i) => (
              <li key={i.product} className="flex justify-between gap-6 border-b border-line py-5">
                <span className="text-[15px] text-ivory"><span className="text-gold">{i.quantity} ×</span> {i.name}</span>
                <span className="tabular-nums text-ivory">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3 text-[14px] text-mute">
            <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{order.shipping ? formatPrice(order.shipping) : 'Complimentary'}</span></div>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[11px] uppercase tracking-[0.3em]">Total</span>
              <Price value={order.total} className="text-5xl text-gold-light" />
            </div>
          </div>
        </div>
        <div className="card h-fit p-7 text-[14px] leading-relaxed text-mute">
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-gold">Delivering to</p>
          <p className="text-ivory">{a.fullName}</p>
          <p>{a.line1}</p>
          <p>{a.city}, {a.state} {a.postalCode}</p>
          <p className="mt-2 text-dim">{a.phone}</p>
        </div>
      </div>

      <Link href="/account/orders" className="link-lux">← All orders</Link>
    </div>
  );
}

export default function OrderPage() {
  return (
    <PageShell eyebrow="Your account" title="Order" accent="details.">
      <RequireAuth>
        <Suspense fallback={<p className="text-[11px] uppercase tracking-[0.34em] text-dim">Loading order…</p>}>
          <OrderDetail />
        </Suspense>
      </RequireAuth>
    </PageShell>
  );
}
