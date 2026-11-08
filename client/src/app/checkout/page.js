'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import PageShell from '@/components/lux/PageShell';
import OrderSummary from '@/components/OrderSummary';
import { useCart } from '@/context/CartContext';
import useHydrated from '@/lib/useHydrated';
import { useAuth } from '@/context/AuthContext';
import { clientApi, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { setCouponCode, useCouponCode, useQuote } from '@/lib/store';
import { openCheckout } from '@/lib/razorpay';

const fields = [
  ['fullName', 'Full name', 'name'],
  ['phone', 'Phone', 'tel'],
  ['line1', 'Address', 'street-address'],
  ['city', 'City', 'address-level2'],
  ['state', 'State', 'address-level1'],
  ['postalCode', 'PIN code', 'postal-code'],
];

function validate(a) {
  const errors = {};
  for (const [key, label] of fields) if (!a[key].trim()) errors[key] = `${label} is required`;
  if (a.phone && !/^[+\d][\d\s-]{7,15}$/.test(a.phone.trim())) errors.phone = 'Enter a valid phone number';
  if (a.postalCode && !/^\d{6}$/.test(a.postalCode.trim())) errors.postalCode = 'PIN code must be 6 digits';
  return errors;
}

function CheckoutForm() {
  const { items, clear, ready } = useCart();
  const code = useCouponCode();
  const { quote, loading, settings } = useQuote(items, code);
  const [remind, setRemind] = useState(true);
  const [stage, setStage] = useState('');
  const hydrated = useHydrated();
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState({ fullName: user?.name || '', phone: '', line1: '', city: '', state: '', postalCode: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!ready || !hydrated) return <p className="py-24 text-center text-[11px] uppercase tracking-[0.34em] text-dim">Loading…</p>;
  if (items.length === 0 && !busy) {
    return (
      <div className="flex flex-col items-start gap-8 border-t border-line pt-12">
        <p className="text-[17px] text-mute">Your bag is empty, so there is nothing to check out yet.</p>
        <Link href="/products" className="btn-primary">Enter the collection</Link>
      </div>
    );
  }

  const hasBlades = items.some((i) => i.type === 'Wiper Blades' || i.type === 'Kit');

  async function placeOrder(e) {
    e.preventDefault();
    const v = validate(address);
    setErrors(v);
    setServerError('');
    if (Object.keys(v).length) return;
    if (code && quote.couponError) {
      setServerError(`Promo code ${code}: ${quote.couponError}. Remove it or try another.`);
      return;
    }

    setBusy(true);
    setStage('Reserving your items…');
    let order;
    let checkout;
    try {
      ({ order, checkout } = await clientApi('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ product: i.productId, quantity: i.quantity })),
          shippingAddress: Object.fromEntries(Object.entries(address).map(([k, val]) => [k, val.trim()])),
          couponCode: code || undefined,
          reminderOptIn: hasBlades && settings.remindersEnabled && remind,
        },
      }));
    } catch (err) {
      setServerError(errorMessage(err));
      setBusy(false);
      setStage('');
      return;
    }

    // The order now holds the stock; the bag is no longer needed
    clear();
    setCouponCode('');
    setStage('Waiting for payment…');
    try {
      const response = await openCheckout(checkout);
      setStage('Confirming payment…');
      await clientApi(`/orders/${order._id}/pay/verify`, { method: 'POST', body: response });
      router.push(`/account/orders/${order._id}?placed=1`);
    } catch (err) {
      // Closed the window, or the payment could not be confirmed: the order page lets them pay again
      router.push(`/account/orders/${order._id}?payment=${err?.dismissed ? 'pending' : 'failed'}`);
    }
  }

  return (
    <form onSubmit={placeOrder} noValidate className="grid gap-14 lg:grid-cols-[1fr_400px]">
      <div>
        <div className="flex items-baseline gap-5">
          <span className="display text-3xl text-accent">I.</span>
          <h2 className="display text-4xl text-frost">Delivery address</h2>
        </div>
        <div className="hairline mt-8" />
        {serverError && (
          <p role="alert" className="mt-8 rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-100">{serverError}</p>
        )}
        <div className="mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2">
          {fields.map(([key, label, autoComplete]) => (
            <div key={key} className={key === 'line1' ? 'sm:col-span-2' : ''}>
              <label htmlFor={key} className="label">{label}</label>
              <input
                id={key}
                className={`input ${errors[key] ? 'border-rose-300/70' : ''}`}
                autoComplete={autoComplete}
                inputMode={key === 'postalCode' || key === 'phone' ? 'numeric' : undefined}
                value={address[key]}
                onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={errors[key] ? `${key}-error` : undefined}
              />
              {errors[key] && <p id={`${key}-error`} className="mt-2 text-xs text-rose-200">{errors[key]}</p>}
            </div>
          ))}
        </div>

        <div className="mt-16 flex items-baseline gap-5">
          <span className="display text-3xl text-accent">II.</span>
          <h2 className="display text-4xl text-frost">Payment</h2>
        </div>
        <div className="hairline mt-8" />
        <div className="card mt-8 flex items-center gap-5 p-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/60 text-accent">₹</span>
          <div>
            <p className="text-[15px] text-frost">Pay securely with Razorpay</p>
            <p className="mt-1 text-[13px] text-dim">
              UPI, cards, net banking and wallets. Your items are held for you while you pay; we never see your card details.
            </p>
          </div>
        </div>
        {!settings.paymentsEnabled && (
          <p role="status" className="mt-4 rounded-2xl border border-amber-200/30 bg-amber-500/10 p-4 text-[13px] text-amber-100">
            Online payments are being set up. You can review your order, but checkout opens shortly.
          </p>
        )}
        {hasBlades && settings.remindersEnabled && (
          <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border border-line p-5">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#2f8cff]"
              checked={remind}
              onChange={(e) => setRemind(e.target.checked)}
            />
            <span>
              <span className="block text-[15px] text-frost">Remind me to check my blades in {settings.reminderMonths} months</span>
              <span className="mt-1 block text-[13px] text-dim">One email when it&apos;s time. You can cancel it any time from your orders.</span>
            </span>
          </label>
        )}
      </div>

      <OrderSummary quote={quote} loading={loading} code={code}>
        <ul className="space-y-3 border-t border-line pt-5 text-[13px] text-mute">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-4">
              <span className="truncate">{i.quantity} × {i.name}</span>
              <span className="shrink-0 tabular-nums">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <button type="submit" data-magnetic="0.2" className="btn-primary h-14 w-full" disabled={busy || loading || !settings.paymentsEnabled}>
          {busy ? stage : `Pay ${formatPrice(quote.total)}`}
        </button>
        <p className="text-center text-[11px] text-dim">
          By paying you agree to our <Link href="/policies/terms" className="link-tech">terms</Link> and{' '}
          <Link href="/policies/refunds" className="link-tech">refund policy</Link>.
        </p>
      </OrderSummary>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <PageShell eyebrow="Checkout" title="Secure" accent="checkout.">
      <RequireAuth>
        <CheckoutForm />
      </RequireAuth>
    </PageShell>
  );
}
