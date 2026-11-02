'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
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

  if (!ready || !hydrated) return <p className="py-16 text-center text-slate-500">Loading…</p>;
  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-4">Browse products</Link>
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
    <form onSubmit={placeOrder} noValidate className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Shipping address</h2>
        {serverError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, label, autoComplete]) => (
            <div key={key} className={key === 'line1' ? 'sm:col-span-2' : ''}>
              <label htmlFor={key} className="label">{label}</label>
              <input
                id={key}
                className={`input ${errors[key] ? 'border-red-500' : ''}`}
                autoComplete={autoComplete}
                inputMode={key === 'postalCode' || key === 'phone' ? 'numeric' : undefined}
                value={address[key]}
                onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
                aria-invalid={Boolean(errors[key])}
              />
              {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
            </div>
          ))}
        </div>
        <p className="rounded-lg bg-mist p-3 text-sm text-slate-600">Payment: cash on delivery.</p>
      </div>

      <OrderSummary subtotal={subtotal}>
        <ul className="space-y-1 border-t border-slate-200 pt-3 text-sm text-slate-600">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-2">
              <span className="truncate">{i.quantity} × {i.name}</span>
              <span>{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Placing order…' : 'Place order'}
        </button>
      </OrderSummary>
    </form>
  );
}

export default function CheckoutPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
      <RequireAuth>
        <CheckoutForm />
      </RequireAuth>
    </div>
  );
}
