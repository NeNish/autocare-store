'use client';

import { useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';

const blank = { number: '', name: '', description: '' };

export default function CategoriesPanel({ categories, onChange }) {
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      number: form.number === '' ? null : Number(form.number),
    };
    if (body.number === null) delete body.number;
    setBusy(true);
    try {
      if (editingId) await clientApi(`/categories/${editingId}`, { method: 'PUT', body });
      else await clientApi('/categories', { method: 'POST', body });
      setForm(blank);
      setEditingId(null);
      await onChange();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    setError('');
    try {
      await clientApi(`/categories/${c._id}`, { method: 'DELETE' });
      await onChange();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ul className="card divide-y divide-line">
        {categories.length === 0 && <li className="p-6 text-sm text-dim">No categories yet.</li>}
        {categories.map((c) => (
          <li key={c._id} className="flex items-start gap-4 p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/[0.05] text-sm font-bold">{c.number ?? '–'}</span>
            <div className="flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-mute">{c.description}</p>
              <p className="text-xs text-dim">{c.productCount} products</p>
            </div>
            <button
              className="text-sm text-gold hover:underline"
              onClick={() => {
                setEditingId(c._id);
                setForm({ number: c.number ?? '', name: c.name, description: c.description || '' });
              }}
            >
              Edit
            </button>
            <button className="text-sm text-rose-200 hover:underline" onClick={() => remove(c)}>Delete</button>
          </li>
        ))}
      </ul>

      <form onSubmit={save} className="card h-fit space-y-3 p-5" noValidate>
        <h3 className="font-semibold">{editingId ? 'Edit category' : 'New category'}</h3>
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
        <div>
          <label className="label" htmlFor="c-num">Number</label>
          <input id="c-num" type="number" min="1" className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="c-name">Name</label>
          <input id="c-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="c-desc">Description</label>
          <textarea id="c-desc" rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(blank); }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
