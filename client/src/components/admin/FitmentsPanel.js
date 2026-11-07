'use client';

import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';

const CONNECTORS = ['J-hook', 'U-hook', 'Pinch tab', 'Push button', 'Side pin', 'Bayonet', 'Other'];
const blank = { make: '', model: '', variant: '', yearFrom: '', yearTo: '', driverIn: '', passengerIn: '', rearIn: '', connector: 'J-hook', source: '', notes: '' };

// Verified vehicle fitments that power the compatibility finder.
// Every record needs a source, so recommendations are never guesswork.
export default function FitmentsPanel() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => clientApi('/fitments').then((d) => setList(d.fitments)).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    const num = (v) => (v === '' ? null : Number(v));
    const body = {
      make: form.make.trim(),
      model: form.model.trim(),
      variant: form.variant.trim(),
      yearFrom: num(form.yearFrom),
      yearTo: num(form.yearTo),
      driverIn: num(form.driverIn),
      passengerIn: num(form.passengerIn),
      rearIn: num(form.rearIn),
      connector: form.connector,
      source: form.source.trim(),
      notes: form.notes.trim(),
    };
    setBusy(true);
    try {
      if (editingId) await clientApi(`/fitments/${editingId}`, { method: 'PUT', body });
      else await clientApi('/fitments', { method: 'POST', body });
      setForm(blank);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(f) {
    if (!window.confirm(`Delete fitment for ${f.make} ${f.model} (${f.yearFrom}–${f.yearTo || 'present'})?`)) return;
    try {
      await clientApi(`/fitments/${f._id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const field = (k, label, props = {}) => (
    <div className={props.wide ? 'sm:col-span-2' : ''}>
      <label className="label" htmlFor={`fm-${k}`}>{label}</label>
      <input id={`fm-${k}`} className="input" value={form[k]} onChange={set(k)} {...props.input} />
    </div>
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_440px]">
      <div className="card overflow-x-auto">
        {list === null ? (
          <p className="p-6 text-sm text-dim">Loading…</p>
        ) : list.length === 0 ? (
          <p className="p-6 text-sm text-mute">No vehicle records yet. Add fitments from a verifiable source (an owner’s manual or a blade maker’s fitment catalogue). Until then, customers can match by measuring their blades.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-white/[0.03] text-xs uppercase text-dim">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Years</th>
                <th className="px-4 py-3">Sizes (in)</th>
                <th className="px-4 py-3">Connector</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((f) => (
                <tr key={f._id}>
                  <td className="px-4 py-3 font-medium">{f.make} {f.model}{f.variant ? ` · ${f.variant}` : ''}</td>
                  <td className="px-4 py-3 text-mute">{f.yearFrom}–{f.yearTo || 'present'}</td>
                  <td className="px-4 py-3 font-mono text-[13px]">{f.driverIn} / {f.passengerIn}{f.rearIn ? ` / R ${f.rearIn}` : ''}</td>
                  <td className="px-4 py-3 text-mute">{f.connector}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-dim" title={f.source}>{f.source}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      className="mr-3 text-accent hover:underline"
                      onClick={() => {
                        setEditingId(f._id);
                        setForm({ ...blank, ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v ?? ''])), yearTo: f.yearTo ?? '', rearIn: f.rearIn ?? '' });
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-rose-200 hover:underline" onClick={() => remove(f)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={save} className="card h-fit space-y-4 p-6" noValidate>
        <h3 className="text-lg font-medium">{editingId ? 'Edit fitment' : 'Add verified fitment'}</h3>
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('make', 'Make')}
          {field('model', 'Model')}
          {field('variant', 'Variant (optional)', { wide: true })}
          {field('yearFrom', 'From year', { input: { inputMode: 'numeric', placeholder: '2018' } })}
          {field('yearTo', 'To year (blank = current)', { input: { inputMode: 'numeric' } })}
          {field('driverIn', 'Driver blade (in)', { input: { inputMode: 'decimal' } })}
          {field('passengerIn', 'Passenger blade (in)', { input: { inputMode: 'decimal' } })}
          {field('rearIn', 'Rear blade (in, optional)', { input: { inputMode: 'decimal' } })}
          <div>
            <label className="label" htmlFor="fm-connector">Connector</label>
            <select id="fm-connector" className="input" value={form.connector} onChange={set('connector')}>
              {CONNECTORS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {field('source', 'Verification source (required)', { wide: true, input: { placeholder: 'e.g. Owner’s manual, p. 312 / blade maker catalogue 2026' } })}
          {field('notes', 'Notes (optional)', { wide: true })}
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save fitment'}</button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
}
