'use client';

import { useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';

const TYPES = ['Wiper Blades', 'Washer Fluid', 'Rain Repellent', 'Microfiber Towel'];

const empty = { name: '', category: '', type: '', price: '', stock: '', description: '', image: '', features: '', isActive: true };

export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    product
      ? {
          ...empty,
          ...product,
          category: product.category?._id || product.category || '',
          features: (product.features || []).join('\n'),
          image: product.image || '',
          description: product.description || '',
          type: product.type || '',
        }
      : { ...empty, category: categories[0]?._id || '' }
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (form.price === '' || Number(form.price) < 0) return setError('Price must be 0 or more');
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      return setError('Stock must be a whole number, 0 or more');
    }

    const body = {
      name: form.name.trim(),
      category: form.category,
      type: form.type.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description.trim(),
      image: form.image.trim(),
      features: form.features.split('\n').map((s) => s.trim()).filter(Boolean),
      isActive: form.isActive,
    };

    setBusy(true);
    try {
      const d = product
        ? await clientApi(`/products/${product._id}`, { method: 'PUT', body })
        : await clientApi('/products', { method: 'POST', body });
      onSaved(d.product);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <h3 className="text-lg font-semibold">{product ? 'Edit product' : 'New product'}</h3>
      {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-name">Name</label>
          <input id="p-name" className="input" value={form.name} onChange={set('name')} />
        </div>
        <div>
          <label className="label" htmlFor="p-cat">Category</label>
          <select id="p-cat" className="input" value={form.category} onChange={set('category')}>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.number ? `${c.number}. ` : ''}{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="p-type">Type</label>
          <input id="p-type" className="input" list="types" value={form.type} onChange={set('type')} />
          <datalist id="types">{TYPES.map((t) => <option key={t} value={t} />)}</datalist>
        </div>
        <div>
          <label className="label" htmlFor="p-price">Price (₹)</label>
          <input id="p-price" type="number" min="0" step="1" className="input" value={form.price} onChange={set('price')} />
        </div>
        <div>
          <label className="label" htmlFor="p-stock">Stock</label>
          <input id="p-stock" type="number" min="0" step="1" className="input" value={form.stock} onChange={set('stock')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-image">Image URL (optional)</label>
          <input id="p-image" className="input" value={form.image} onChange={set('image')} placeholder="https://…" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-desc">Description</label>
          <textarea id="p-desc" rows={3} className="input" value={form.description} onChange={set('description')} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="p-feat">Features (one per line)</label>
          <textarea id="p-feat" rows={3} className="input" value={form.features} onChange={set('features')} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
          Visible in store
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
