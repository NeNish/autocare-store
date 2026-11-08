'use client';

import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { missingBusinessFields } from '@/lib/business';

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
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const missing = missingBusinessFields();

  async function sync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const { result } = await clientApi('/catalogue/sync', { method: 'POST' });
      setSyncMsg(`Done: ${result.products} standard products checked, ${result.newProducts} added, ${result.newKits} new kit(s).`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    clientApi('/settings')
      .then((d) => {
        setForm({
          shippingFee: String(d.settings.shippingFee),
          freeShippingFrom: String(d.settings.freeShippingFrom),
          remindersEnabled: d.settings.remindersEnabled,
          reminderMonths: String(d.settings.reminderMonths),
          codEnabled: d.settings.codEnabled ?? true,
          codFee: String(d.settings.codFee ?? 0),
          codMaxOrder: String(d.settings.codMaxOrder ?? 0),
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
          codEnabled: form.codEnabled,
          codFee: Number(form.codFee),
          codMaxOrder: Number(form.codMaxOrder),
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
          <h3 className="text-[15px] text-frost">Cash on delivery</h3>
          <label className="mt-4 flex items-center gap-3 text-sm text-mute">
            <input type="checkbox" checked={form.codEnabled} onChange={set('codEnabled')} className="accent-[#2f8cff]" />
            Offer cash on delivery at checkout
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="st-codfee" className="label">COD fee (₹, 0 = none)</label>
              <input id="st-codfee" className="input" inputMode="decimal" value={form.codFee} onChange={set('codFee')} />
            </div>
            <div>
              <label htmlFor="st-codmax" className="label">COD up to (₹, 0 = no limit)</label>
              <input id="st-codmax" className="input" inputMode="decimal" value={form.codMaxOrder} onChange={set('codMaxOrder')} />
            </div>
          </div>
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
          <Check
            ok={missing.length === 0}
            label="Business details"
            fix={`Add to the website project in Vercel: ${missing.join(', ')}`}
          />
          <Check ok label="Database" fix="" />
        </ul>
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-frost">Product catalogue</p>
          <p className="mt-1 text-xs text-dim">Adds any missing standard products and kits, and fills in blade sizes. Your prices, stock and photos are kept.</p>
          <button type="button" className="btn-secondary mt-4 h-10 px-5" onClick={sync} disabled={syncing}>
            {syncing ? 'Updating…' : 'Update catalogue'}
          </button>
          {syncMsg && <p role="status" className="mt-3 text-xs text-emerald-200">{syncMsg}</p>}
        </div>
        <p className="mt-4 text-xs text-dim">See HANDOVER.md in the repository for step-by-step instructions.</p>
      </div>
    </div>
  );
}
