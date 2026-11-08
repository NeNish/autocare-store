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
import { openCheckout } from '@/lib/razorpay';

function useCountdown(until) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const ms = Math.max(0, new Date(until).getTime() - now);
  return { ms, label: `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}` };
}

const METHOD = { cash: 'cash on delivery', upi: 'UPI', card: 'Card', netbanking: 'Net banking', wallet: 'Wallet', emi: 'EMI', paylater: 'Pay later' };

function OrderDetail() {
  const { id } = useParams();
  const params = useSearchParams();
  const placed = params.get('placed') === '1';
  const paymentNote = params.get('payment');
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [windowMin, setWindowMin] = useState(30);

  useEffect(() => {
    clientApi(`/orders/${id}`)
      .then((d) => {
        setOrder(d.order);
        if (d.paymentWindowMin) setWindowMin(d.paymentWindowMin);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [id]);

  const awaiting = order?.status === 'awaiting_payment';
  const countdown = useCountdown(awaiting ? new Date(new Date(order.createdAt).getTime() + windowMin * 60000) : null);

  async function pay() {
    setBusy('pay');
    setError('');
    try {
      const { checkout } = await clientApi(`/orders/${id}/pay`, { method: 'POST' });
      const response = await openCheckout(checkout);
      const d = await clientApi(`/orders/${id}/pay/verify`, { method: 'POST', body: response });
      setOrder((o) => ({ ...o, ...d.order, user: o.user }));
    } catch (e) {
      if (!e?.dismissed) setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  }

  async function cancel() {
    const paid = order.payment?.status === 'paid' && order.paymentMethod !== 'cod';
    if (!window.confirm(paid ? 'Cancel this order? The full amount will be refunded to your original payment method.' : 'Cancel this order?')) return;
    setBusy('cancel');
    try {
      const d = await clientApi(`/orders/${id}/cancel`, { method: 'POST' });
      setOrder((o) => ({ ...o, ...d.order, user: o.user }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy('');
    }
  }

  if (error && !order) return <p className="text-rose-200">{error}</p>;
  if (!order) return <p className="text-[11px] uppercase tracking-[0.34em] text-dim">Loading order…</p>;

  const isOwner = String(order.user?._id) === String(user?._id);
  const a = order.shippingAddress;

  return (
    <div className="space-y-12">
      {placed && (order.payment?.status === 'paid' || order.paymentMethod === 'cod') && (
        <div className="glass relative overflow-hidden rounded-[24px] p-8 sm:p-10">
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl" style={{ background: '#2f8cff33' }} />
          <p className="eyebrow">{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Payment received'}</p>
          <p className="display mt-4 text-4xl text-frost sm:text-5xl">Thank you. Your order is <em className="chrome-text">confirmed.</em></p>
          <p className="mt-4 text-[15px] text-mute">We&apos;ll update its status here as it makes its way to you.</p>
        </div>
      )}
      {awaiting && isOwner && (
        <div role="status" className="glass rounded-[24px] p-8 sm:p-10">
          <p className="eyebrow">{paymentNote === 'failed' ? 'Payment not confirmed' : 'Payment pending'}</p>
          <p className="display mt-4 text-3xl text-frost sm:text-4xl">Complete your payment to confirm this order.</p>
          <p className="mt-4 text-[15px] text-mute">
            {countdown && countdown.ms > 0
              ? <>Your items are held for <span className="font-mono text-ice">{countdown.label}</span>. If you were charged but this page still says pending, wait a minute and refresh — we confirm payments with Razorpay directly.</>
              : 'The hold on your items has ended. Refresh to see the latest status.'}
          </p>
          <button onClick={pay} disabled={Boolean(busy) || (countdown && countdown.ms === 0)} className="btn-primary mt-7 h-12">
            {busy === 'pay' ? 'Opening payment…' : `Pay ${formatPrice(order.total)}`}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-rose-200">{error}</p>}

      <div className="flex flex-wrap items-center gap-6 border-y border-line py-6">
        <div className="flex-1">
          <p className="font-mono text-[13px] tracking-[0.12em] text-accent">Order #{order._id.slice(-8).toUpperCase()}</p>
          <p className="mt-1 text-[14px] text-mute">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
        {isOwner && ['awaiting_payment', 'pending'].includes(order.status) && (
          <button onClick={cancel} disabled={Boolean(busy)} className="btn-danger h-11">
            {busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}
          </button>
        )}
      </div>

      <div className="grid gap-12 md:grid-cols-[1fr_320px]">
        <div>
          <ul className="border-t border-line">
            {order.items.map((i) => (
              <li key={i.product} className="flex justify-between gap-6 border-b border-line py-5">
                <span className="text-[15px] text-frost"><span className="text-accent">{i.quantity} ×</span> {i.name}</span>
                <span className="tabular-nums text-frost">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-3 text-[14px] text-mute">
            <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && (
              <div className="flex justify-between"><span>Discount{order.coupon?.code ? ` (${order.coupon.code})` : ''}</span><span className="tabular-nums text-accent-light">−{formatPrice(order.discount)}</span></div>
            )}
            <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{order.shipping ? formatPrice(order.shipping) : 'Free'}</span></div>
            {order.codFee > 0 && (
              <div className="flex justify-between"><span>Cash on delivery fee</span><span className="tabular-nums">{formatPrice(order.codFee)}</span></div>
            )}
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[11px] uppercase tracking-[0.3em]">Total</span>
              <Price value={order.total} className="text-5xl text-accent-light" />
            </div>
          </div>
        </div>
        <div className="card h-fit p-7 text-[14px] leading-relaxed text-mute">
          <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent">Delivering to</p>
          <p className="text-frost">{a.fullName}</p>
          <p>{a.line1}</p>
          <p>{a.city}, {a.state} {a.postalCode}</p>
          <p className="mt-2 text-dim">{a.phone}</p>
          <p className="mb-3 mt-8 text-[11px] uppercase tracking-[0.3em] text-accent">Payment</p>
          {order.payment?.status === 'paid' && (
            <p>Paid{order.payment.method ? ` by ${METHOD[order.payment.method] || order.payment.method}` : ''} on {formatDate(order.payment.paidAt)}</p>
          )}
          {order.payment?.status === 'refunded' && (
            <p>Refunded in full to the original payment method. Banks usually take 5–7 working days to show it.</p>
          )}
          {order.paymentMethod === 'cod' && order.payment?.status !== 'paid' && order.status !== 'cancelled' && (
            <p>Cash on delivery: pay {formatPrice(order.total)} when it arrives.</p>
          )}
          {order.paymentMethod !== 'cod' && order.payment?.status !== 'paid' && order.payment?.status !== 'refunded' && <p>Not paid</p>}
          {order.payment?.razorpayPaymentId && <p className="mt-1 break-all font-mono text-[11px] text-dim">Ref {order.payment.razorpayPaymentId}</p>}
          {order.cancelReason && <p className="mt-4 text-dim">{order.cancelReason}</p>}
        </div>
      </div>

      <Link href="/account/orders" className="link-tech">← All orders</Link>
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
