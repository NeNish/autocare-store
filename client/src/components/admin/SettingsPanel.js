'use client';

import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';

function Check({ ok, label, fix }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span aria-hidden="true" className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-300' : 'bg-amber-300'}`} />
      <span>
        <span className="text-frost">{label}: {ok ? 'on' : 'not set up'}</span>
        {!ok && <span className="block text-xs text-dim">{fix}</span>}
      </span>
    </li>
  );
}

export default function SettingsPanel() {
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    clientApi('/settings')
      .then((d) => {
        setForm({
          shippingFee: String(d.settings.shippingFee),
          freeShippingFrom: String(d.settings.freeShippingFrom),
          remindersEnabled: d.settings.remindersEnabled,
          reminderMonths: String(d.settings.reminderMonths),
        });
        setStatus(d.status);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  if (!form) return <p className="text-sm text-dim">{error || 'Loading settings…'}</p>;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      await clientApi('/settings', {
        method: 'PUT',
        body: {
          shippingFee: Number(form.shippingFee),
          freeShippingFrom: Number(form.freeShippingFrom),
          remindersEnabled: form.remindersEnabled,
          reminderMonths: Number(form.reminderMonths),
        },
      });
      setMsg('Saved. New prices apply to the next order.');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const fee = Number(form.shippingFee) || 0;
  const from = Number(form.freeShippingFrom) || 0;
  const preview = fee === 0 ? 'Delivery is free on every order.' : from > 0 ? `${formatPrice(fee)} delivery, free from ${formatPrice(from)}.` : `${formatPrice(fee)} delivery on every order.`;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <form onSubmit={save} className="card space-y-6 p-6" noValidate>
        <div>
          <h3 className="text-[15px] text-frost">Delivery charges</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="st-fee" className="label">Delivery fee (₹)</label>
              <input id="st-fee" className="input" inputMode="decimal" value={form.shippingFee} onChange={set('shippingFee')} />
            </div>
            <div>
              <label htmlFor="st-free" className="label">Free delivery from (₹, 0 = never)</label>
              <input id="st-free" className="input" inputMode="decimal" value={form.freeShippingFrom} onChange={set('freeShippingFrom')} />
            </div>
          </div>
          <p className="mt-3 text-sm text-mute">{preview}</p>
        </div>
        <div className="hairline" />
        <div>
          <h3 className="text-[15px] text-frost">Blade replacement reminders</h3>
          <label className="mt-4 flex items-center gap-3 text-sm text-mute">
            <input type="checkbox" checked={form.remindersEnabled} onChange={set('remindersEnabled')} className="accent-[#2f8cff]" />
            Offer the reminder at checkout
          </label>
          <div className="mt-4 max-w-[220px]">
            <label htmlFor="st-months" className="label">Remind after (months)</label>
            <input id="st-months" className="input" inputMode="numeric" value={form.reminderMonths} onChange={set('reminderMonths')} />
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
        {msg && <p role="status" className="text-sm text-emerald-200">{msg}</p>}
        <button type="submit" className="btn-primary h-11">Save settings</button>
      </form>

      <div className="card h-fit p-6 text-sm">
        <h3 className="text-[15px] text-frost">Launch checklist</h3>
        <ul className="mt-2 divide-y divide-line">
          <Check ok={status.paymentsEnabled} label="Razorpay payments" fix="Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the API project in Vercel." />
          <Check ok={status.webhookConfigured} label="Payment webhook" fix="Create a webhook in Razorpay pointing at /api/payments/razorpay/webhook and add RAZORPAY_WEBHOOK_SECRET." />
          <Check ok={status.emailEnabled} label="Reminder emails" fix="Optional: add RESEND_API_KEY and EMAIL_FROM to send reminders automatically." />
        </ul>
        <p className="mt-4 text-xs text-dim">See HANDOVER.md in the repository for step-by-step instructions.</p>
      </div>
    </div>
  );
}
