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
        <Link href="/products" className="btn-primary">Browse products</Link>
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
            <span className="font-mono text-[13px] tracking-[0.12em] text-accent">#{o._id.slice(-8).toUpperCase()}</span>
            <span className="display hidden text-2xl text-frost transition-transform duration-500 group-hover:translate-x-2 sm:block">
              {formatDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items
            </span>
            <StatusBadge status={o.status} />
            <span className="w-28 text-right text-[15px] tabular-nums text-frost">{formatPrice(o.total)}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    clientApi('/reminders/mine')
      .then((d) => setReminders(d.reminders))
      .catch(() => {});
  }, []);
  const active = reminders.filter((r) => r.status === 'scheduled');
  if (!active.length) return null;

  async function cancel(id) {
    try {
      await clientApi(`/reminders/${id}/cancel`, { method: 'POST' });
      setReminders((list) => list.map((r) => (r._id === id ? { ...r, status: 'cancelled' } : r)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <section aria-labelledby="rem-title" className="mt-20">
      <p className="eyebrow">Blade reminders</p>
      <h2 id="rem-title" className="display mt-3 text-3xl text-frost">We&apos;ll remind you when it&apos;s time.</h2>
      {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
      <ul className="mt-8 border-t border-line">
        {active.map((r) => (
          <li key={r._id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-5">
            <div>
              <p className="text-[15px] text-frost">{r.products.join(', ')}</p>
              <p className="mt-1 text-[13px] text-dim">Reminder on {formatDate(r.dueAt)} to {r.email}</p>
            </div>
            <button type="button" className="btn-secondary h-10 px-5" onClick={() => cancel(r._id)}>Cancel reminder</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OrdersPage() {
  return (
    <PageShell eyebrow="Your account" title="Your" accent="orders.">
      <RequireAuth>
        <OrdersList />
        <Reminders />
      </RequireAuth>
    </PageShell>
  );
}
