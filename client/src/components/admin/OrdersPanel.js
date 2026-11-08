'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';
import { formatDate, formatPrice, ORDER_STATUSES, STATUS_LABELS } from '@/lib/format';
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
    const paid = order.payment?.status === 'paid';
    if (status === 'cancelled' && !window.confirm(paid ? `Cancel this order and refund ${formatPrice(order.total)} through Razorpay?` : 'Cancel this order and return items to stock?')) return;
    setError('');
    try {
      const d = await clientApi(`/orders/${order._id}/status`, { method: 'PATCH', body: { status } });
      setOrders((list) => list.map((o) => (o._id === order._id ? { ...o, status: d.order.status, payment: d.order.payment } : o)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (!orders) return <p className="text-sm text-dim">{error || 'Loading orders…'}</p>;

  const shown = filter ? orders.filter((o) => o.status === filter) : orders;
  const paidOrders = orders.filter((o) => o.payment?.status === 'paid');
  const revenue = paidOrders.reduce((n, o) => n + o.total, 0);
  const discounts = paidOrders.reduce((n, o) => n + (o.discount || 0), 0);
  const aov = paidOrders.length ? revenue / paidOrders.length : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Paid orders" value={paidOrders.length} />
        <Stat label="To fulfil (paid + packing)" value={orders.filter((o) => ['pending', 'processing'].includes(o.status)).length} />
        <Stat label="Revenue collected" value={formatPrice(revenue)} />
        <Stat label="Average order · discounts" value={`${formatPrice(aov)}`} sub={`${formatPrice(discounts)} in promo discounts`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="status-filter" className="text-sm text-mute">Show</label>
        <select id="status-filter" className="input w-44" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['awaiting_payment', ...ORDER_STATUSES].map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-rose-200">{error}</p>}

      {shown.length === 0 ? (
        <p className="card p-8 text-center text-sm text-dim">No orders.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line bg-white/[0.03] text-xs uppercase text-dim">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((o) => (
                <tr key={o._id}>
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/account/orders/${o._id}`} className="text-accent hover:underline">#{o._id.slice(-8).toUpperCase()}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {o.user?.name}
                    <span className="block text-xs text-dim">{o.user?.email}</span>
                  </td>
                  <td className="px-4 py-3">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={o.payment?.status === 'paid' ? 'text-emerald-200' : o.payment?.status === 'refunded' ? 'text-amber-100' : 'text-dim'}>
                      {{ paid: 'Paid', refunded: 'Refunded', failed: 'Failed', unpaid: 'Unpaid' }[o.payment?.status || 'unpaid']}
                    </span>
                    {o.coupon?.code && <span className="block font-mono text-dim">{o.coupon.code} −{formatPrice(o.discount)}</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <select
                      aria-label="Change status"
                      className="input w-36 py-1"
                      value={o.status}
                      disabled={o.status === 'cancelled'}
                      onChange={(e) => changeStatus(o, e.target.value)}
                    >
                      {o.status === 'awaiting_payment' ? (
                        <>
                          <option value="awaiting_payment">{STATUS_LABELS.awaiting_payment}</option>
                          <option value="cancelled">{STATUS_LABELS.cancelled}</option>
                        </>
                      ) : (
                        ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)
                      )}
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

function Stat({ label, value, sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-dim">{label}</p>
      <p className="display mt-2 text-4xl tabular-nums text-accent-light">{value}</p>
      {sub && <p className="mt-1 text-xs text-dim">{sub}</p>}
    </div>
  );
}
