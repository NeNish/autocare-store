'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import StatusBadge from '@/components/StatusBadge';
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

  if (error && !order) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-slate-500">Loading order…</p>;

  const isOwner = String(order.user?._id) === String(user?._id);
  const a = order.shippingAddress;

  return (
    <div className="space-y-6">
      {placed && (
        <div className="rounded-xl bg-green-50 p-4 text-green-800">
          <p className="font-semibold">Thank you! Your order has been placed.</p>
          <p className="text-sm">We&apos;ll update the status here as it moves along.</p>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1">
          <p className="font-mono text-sm text-slate-500">Order #{order._id.slice(-8).toUpperCase()}</p>
          <p className="text-sm">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
        {isOwner && order.status === 'pending' && (
          <button onClick={cancel} disabled={busy} className="btn-secondary text-red-600">
            {busy ? 'Cancelling…' : 'Cancel order'}
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="card divide-y divide-slate-100">
          {order.items.map((i) => (
            <div key={i.product} className="flex justify-between gap-4 p-4 text-sm">
              <span>{i.quantity} × {i.name}</span>
              <span className="font-medium">{formatPrice(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="space-y-1 p-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>{order.shipping ? formatPrice(order.shipping) : 'Free'}</span></div>
            <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>
        <div className="card h-fit p-5 text-sm">
          <p className="mb-2 font-semibold">Shipping to</p>
          <p>{a.fullName}</p>
          <p>{a.line1}</p>
          <p>{a.city}, {a.state} {a.postalCode}</p>
          <p className="mt-1 text-slate-500">{a.phone}</p>
        </div>
      </div>

      <Link href="/account/orders" className="text-sm font-medium text-brand hover:underline">← All orders</Link>
    </div>
  );
}

export default function OrderPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Order details</h1>
      <RequireAuth>
        <Suspense fallback={<p className="text-slate-500">Loading order…</p>}>
          <OrderDetail />
        </Suspense>
      </RequireAuth>
    </div>
  );
}
