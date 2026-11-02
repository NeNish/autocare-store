'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import StatusBadge from '@/components/StatusBadge';
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!orders) return <p className="text-slate-500">Loading orders…</p>;
  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-600">You haven&apos;t placed any orders yet.</p>
        <Link href="/products" className="btn-primary mt-4">Start shopping</Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o._id}>
          <Link href={`/account/orders/${o._id}`} className="card flex flex-wrap items-center gap-4 p-4 hover:border-brand">
            <div className="flex-1">
              <p className="font-mono text-sm text-slate-500">#{o._id.slice(-8).toUpperCase()}</p>
              <p className="text-sm">{formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</p>
            </div>
            <StatusBadge status={o.status} />
            <span className="w-24 text-right font-semibold">{formatPrice(o.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">My orders</h1>
      <RequireAuth>
        <OrdersList />
      </RequireAuth>
    </div>
  );
}
