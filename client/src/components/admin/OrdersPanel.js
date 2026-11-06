'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';
import { formatDate, formatPrice, ORDER_STATUSES } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';

export default function OrdersPanel() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    clientApi('/orders')
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  async function changeStatus(order, status) {
    if (status === 'cancelled' && !window.confirm('Cancel this order and return items to stock?')) return;
    setError('');
    try {
      const d = await clientApi(`/orders/${order._id}/status`, { method: 'PATCH', body: { status } });
      setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, status: d.order.status } : o)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (!orders) return <p className="text-sm text-dim">{error || 'Loading orders…'}</p>;

  const shown = filter ? orders.filter((o) => o.status === filter) : orders;
  const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={orders.length} />
        <Stat label="Open (pending + processing)" value={orders.filter((o) => ['pending', 'processing'].includes(o.status)).length} />
        <Stat label="Revenue (excl. cancelled)" value={formatPrice(revenue)} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="status-filter" className="text-sm text-mute">Show</label>
        <select id="status-filter" className="input w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-rose-200">{error}</p>}

      {shown.length === 0 ? (
        <p className="card p-8 text-center text-sm text-dim">No orders.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-white/[0.03] text-xs uppercase text-dim">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/account/orders/${o._id}`} className="text-gold hover:underline">#{o._id.slice(-8).toUpperCase()}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.user?.name}
                    <span className="block text-xs text-dim">{o.user?.email}</span>
                  </td>
                  <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <select
                      aria-label="Change status"
                      className="input w-36 py-1"
                      value={o.status}
                      disabled={o.status === 'cancelled'}
                      onChange={(e) => changeStatus(o, e.target.value)}
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-dim">{label}</p>
      <p className="display mt-2 text-4xl tabular-nums text-gold-light">{value}</p>
    </div>
  );
}
