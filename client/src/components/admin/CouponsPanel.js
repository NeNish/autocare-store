'use client';

import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/format';

const EMPTY = { code: '', description: '', kind: 'percent', value: '', minSubtotal: '', maxDiscount: '', startsAt: '', endsAt: '', usageLimit: '', oncePerCustomer: true, active: true };
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function describe(c) {
  const off = c.kind === 'percent' ? `${c.value}% off` : `${formatPrice(c.value)} off`;
  const parts = [off];
  if (c.maxDiscount) parts.push(`up to ${formatPrice(c.maxDiscount)}`);
  if (c.minSubtotal) parts.push(`on ${formatPrice(c.minSubtotal)}+`);
  return parts.join(' ');
}

function state(c) {
  const now = new Date();
  if (!c.active) return 'Off';
  if (c.startsAt && new Date(c.startsAt) > now) return 'Scheduled';
  if (c.endsAt && new Date(c.endsAt) < now) return 'Expired';
  if (c.usageLimit && c.usedCount >= c.usageLimit) return 'Used up';
  return 'Live';
}

export default function CouponsPanel() {
  const [coupons, setCoupons] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => clientApi('/coupons').then((d) => setCoupons(d.coupons)).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    const num = (v) => (v === '' ? null : Number(v));
    const body = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value),
      minSubtotal: num(form.minSubtotal) ?? 0,
      maxDiscount: form.kind === 'percent' ? num(form.maxDiscount) : null,
      usageLimit: num(form.usageLimit),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt ? `${form.endsAt}T23:59:59` : null,
    };
    setBusy(true);
    try {
      await clientApi(editing ? `/coupons/${editing}` : '/coupons', { method: editing ? 'PUT' : 'POST', body });
      setForm(EMPTY);
      setEditing(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function edit(c) {
    setEditing(c._id);
    setForm({
      code: c.code, description: c.description || '', kind: c.kind, value: String(c.value),
      minSubtotal: c.minSubtotal ? String(c.minSubtotal) : '', maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      startsAt: toInput(c.startsAt), endsAt: toInput(c.endsAt), usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      oncePerCustomer: c.oncePerCustomer, active: c.active,
    });
  }

  async function remove(c) {
    if (!window.confirm(`Delete code ${c.code}?`)) return;
    try {
      await clientApi(`/coupons/${c._id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const field = (id, label, props = {}) => (
    <div>
      <label htmlFor={`cp-${id}`} className="label">{label}</label>
      <input id={`cp-${id}`} className="input" value={form[id]} onChange={set(id)} {...props} />
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        {error && <p role="alert" className="mb-4 text-sm text-rose-200">{error}</p>}
        {!coupons ? (
          <p className="text-sm text-dim">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="card p-8 text-center text-sm text-dim">No promo codes yet. Create one to run a launch offer or reward repeat customers.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-white/[0.03] text-xs uppercase text-dim">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Offer</th>
                  <th className="px-4 py-3">Valid</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coupons.map((c) => (
                  <tr key={c._id}>
                    <td className="px-4 py-3 font-mono text-ice">{c.code}<span className="block font-sans text-xs text-dim">{c.description}</span></td>
                    <td className="px-4 py-3">{describe(c)}</td>
                    <td className="px-4 py-3 text-xs text-mute">
                      {c.startsAt ? formatDate(c.startsAt) : 'Now'} – {c.endsAt ? formatDate(c.endsAt) : 'No end'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                    <td className="px-4 py-3">{state(c)}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="link-tech mr-4 text-xs" onClick={() => edit(c)}>Edit</button>
                      <button className="text-xs text-rose-200 hover:underline" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={save} className="card h-fit space-y-4 p-6" noValidate>
        <h3 className="text-[15px] text-frost">{editing ? 'Edit promo code' : 'New promo code'}</h3>
        {field('code', 'Code', { placeholder: 'MONSOON10', maxLength: 30, className: 'input font-mono uppercase' })}
        {field('description', 'Shown to shoppers (optional)', { placeholder: '10% off your first order', maxLength: 200 })}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cp-kind" className="label">Type</label>
            <select id="cp-kind" className="input" value={form.kind} onChange={set('kind')}>
              <option value="percent">Percent off</option>
              <option value="fixed">Amount off (₹)</option>
            </select>
          </div>
          {field('value', form.kind === 'percent' ? 'Percent' : 'Amount (₹)', { inputMode: 'decimal' })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('minSubtotal', 'Min. order (₹)', { inputMode: 'decimal', placeholder: '0' })}
          {form.kind === 'percent' && field('maxDiscount', 'Max discount (₹)', { inputMode: 'decimal', placeholder: 'No cap' })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('startsAt', 'Starts', { type: 'date' })}
          {field('endsAt', 'Ends', { type: 'date' })}
        </div>
        {field('usageLimit', 'Total uses (optional)', { inputMode: 'numeric', placeholder: 'Unlimited' })}
        <label className="flex items-center gap-3 text-sm text-mute">
          <input type="checkbox" checked={form.oncePerCustomer} onChange={set('oncePerCustomer')} className="accent-[#2f8cff]" /> Once per customer
        </label>
        <label className="flex items-center gap-3 text-sm text-mute">
          <input type="checkbox" checked={form.active} onChange={set('active')} className="accent-[#2f8cff]" /> Active
        </label>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary h-11 flex-1" disabled={busy}>{busy ? 'Saving…' : 'Save code'}</button>
          {editing && <button type="button" className="btn-secondary h-11" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>
    </div>
  );
}
