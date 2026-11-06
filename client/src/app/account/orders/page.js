'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import StatusBadge from '@/components/StatusBadge';
import PageShell from '@/components/lux/PageShell';
import { clientApi, errorMessage } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';

function OrdersList() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    clientApi('/orders/mine')
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <p className="text-rose-200">{error}</p>;
  if (!orders) return <p className="text-[11px] uppercase tracking-[0.34em] text-dim">Loading orders…</p>;
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-8 border-t border-line pt-12">
        <p className="text-[17px] text-mute">You haven&apos;t placed an order yet.</p>
        <Link href="/products" className="btn-primary">Enter the collection</Link>
      </div>
    );
  }

  return (
    <ol className="border-t border-line">
      {orders.map((o) => (
        <li key={o._id}>
          <Link
            href={`/account/orders/${o._id}`}
            data-cursor="View"
            className="group grid grid-cols-[1fr_auto] items-center gap-6 border-b border-line py-8 transition-colors sm:grid-cols-[200px_1fr_auto_auto] sm:gap-10"
          >
            <span className="font-mono text-[13px] tracking-[0.12em] text-gold">#{o._id.slice(-8).toUpperCase()}</span>
            <span className="display hidden text-2xl text-ivory transition-transform duration-500 group-hover:translate-x-2 sm:block">
              {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items
            </span>
            <StatusBadge status={o.status} />
            <span className="w-28 text-right text-[15px] tabular-nums text-ivory">{formatPrice(o.total)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default function OrdersPage() {
  return (
    <PageShell eyebrow="Your account" title="Your" accent="orders.">
      <RequireAuth>
        <OrdersList />
      </RequireAuth>
    </PageShell>
  );
}
