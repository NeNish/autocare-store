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
  const { items, subtotal, clear, ready } = useCart();
  const hydrated = useHydrated();
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState({ fullName: user?.name || '', phone: '', line1: '', city: '', state: '', postalCode: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!ready || !hydrated) return <p className="py-24 text-center text-[11px] uppercase tracking-[0.34em] text-dim">Loading…</p>;
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-8 border-t border-line pt-12">
        <p className="text-[17px] text-mute">Your bag is empty, so there is nothing to check out yet.</p>
        <Link href="/products" className="btn-primary">Enter the collection</Link>
      </div>
    );
  }

  async function placeOrder(e) {
    e.preventDefault();
    const v = validate(address);
    setErrors(v);
    setServerError('');
    if (Object.keys(v).length) return;

    setBusy(true);
    try {
      const { order } = await clientApi('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ product: i.productId, quantity: i.quantity })),
          shippingAddress: Object.fromEntries(Object.entries(address).map(([k, val]) => [k, val.trim()])),
        },
      });
      clear();
      router.push(`/account/orders/${order._id}?placed=1`);
    } catch (err) {
      setServerError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={placeOrder} noValidate className="grid gap-14 lg:grid-cols-[1fr_400px]">
      <div>
        <div className="flex items-baseline gap-5">
          <span className="display text-3xl italic text-gold">I.</span>
          <h2 className="display text-4xl text-ivory">Delivery address</h2>
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
          <span className="display text-3xl italic text-gold">II.</span>
          <h2 className="display text-4xl text-ivory">Payment</h2>
        </div>
        <div className="hairline mt-8" />
        <div className="card mt-8 flex items-center gap-5 p-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/60 text-gold">₹</span>
          <div>
            <p className="text-[15px] text-ivory">Cash on delivery</p>
            <p className="mt-1 text-[13px] text-dim">Pay when your order arrives. Online payments are coming soon.</p>
          </div>
        </div>
      </div>

      <OrderSummary subtotal={subtotal}>
        <ul className="space-y-3 border-t border-line pt-5 text-[13px] text-mute">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-4">
              <span className="truncate">{i.quantity} × {i.name}</span>
              <span className="shrink-0 tabular-nums">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <button type="submit" data-magnetic="0.2" className="btn-primary h-14 w-full" disabled={busy}>
          {busy ? 'Placing order…' : 'Place order'}
        </button>
      </OrderSummary>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <PageShell eyebrow="Checkout" title="Almost" accent="yours.">
      <RequireAuth>
        <CheckoutForm />
      </RequireAuth>
    </PageShell>
  );
}
