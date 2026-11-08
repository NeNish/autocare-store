'use client';

import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';

const TYPES = ['Wiper Blades', 'Washer Fluid', 'Rain Repellent', 'Microfiber Towel', 'Kit'];

// Kit contents editor: other catalogue products and quantities
function KitEditor({ value, onChange, selfId }) {
  const [options, setOptions] = useState([]);
  useEffect(() => {
    clientApi('/products?limit=100&all=true')
      .then((d) => setOptions(d.products.filter((p) => p.type !== 'Kit' && p._id !== selfId)))
      .catch(() => {});
  }, [selfId]);
  const byId = Object.fromEntries(options.map((p) => [p._id, p]));
  const worth = value.reduce((n, k) => n + (byId[k.product]?.price || 0) * k.quantity, 0);
  const setRow = (i, patch) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <fieldset className="sm:col-span-2 rounded-2xl border border-line p-4">
      <legend className="px-2 text-sm text-frost">Kit contents</legend>
      <div className="space-y-2">
        {value.map((row, i) => (
          <div key={i} className="flex gap-2">
            <label className="sr-only" htmlFor={`kit-p-${i}`}>Product {i + 1}</label>
            <select id={`kit-p-${i}`} className="input flex-1" value={row.product} onChange={(e) => setRow(i, { product: e.target.value })}>
              <option value="">Choose a product…</option>
              {options.map((p) => <option key={p._id} value={p._id}>{p.name} · ₹{p.price}</option>)}
            </select>
            <label className="sr-only" htmlFor={`kit-q-${i}`}>Quantity {i + 1}</label>
            <input id={`kit-q-${i}`} type="number" min="1" max="20" className="input w-20" value={row.quantity} onChange={(e) => setRow(i, { quantity: Number(e.target.value) || 1 })} />
            <button type="button" className="btn-secondary px-3" aria-label={`Remove item ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
      <button type="button" className="link-tech mt-3 text-xs" onClick={() => onChange([...value, { product: '', quantity: 1 }])}>+ Add item</button>
      {worth > 0 && <p className="mt-3 text-xs text-dim">Bought separately today: ₹{worth}. Price the kit below this so shoppers see a saving.</p>}
    </fieldset>
  );
}

const empty = { name: '', category: '', type: '', price: '', stock: '', description: '', image: '', features: '', bladeLengths: '', connectors: '', kitItems: [], isActive: true };

export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    product
      ? {
          ...empty,
          ...product,
          category: product.category?._id || product.category || '',
          features: (product.features || []).join('\n'),
          bladeLengths: (product.bladeLengthsIn || []).join(', '),
          connectors: (product.connectors || []).join(', '),
          kitItems: (product.kitItems || []).map((k) => ({ product: k.product?._id || k.product, quantity: k.quantity })),
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
    if (form.bladeLengths.split(',').map((x) => x.trim()).filter(Boolean).some((x) => !(Number(x) >= 8 && Number(x) <= 40))) {
      return setError('Blade lengths must be numbers between 8 and 40 (inches), separated by commas');
    }
    if (form.type === 'Kit' && form.kitItems.filter((k) => k.product).length < 2) {
      return setError('A kit needs at least two products');
    }
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
      bladeLengthsIn: form.bladeLengths.split(',').map((s) => s.trim()).filter(Boolean).map(Number),
      connectors: form.connectors.split(',').map((s) => s.trim()).filter(Boolean),
      kitItems: form.type === 'Kit' ? form.kitItems.filter((k) => k.product) : [],
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
        <div>
          <label className="label" htmlFor="p-lengths">Blade lengths, inches (wiper blades)</label>
          <input id="p-lengths" className="input" value={form.bladeLengths} onChange={set('bladeLengths')} placeholder="e.g. 22, 16" />
          <p className="mt-1 text-xs text-dim">From the packaging. Used by the compatibility finder.</p>
        </div>
        <div>
          <label className="label" htmlFor="p-conn">Arm connectors</label>
          <input id="p-conn" className="input" value={form.connectors} onChange={set('connectors')} placeholder="e.g. J-hook, U-hook" />
        </div>
        {form.type === 'Kit' && (
          <KitEditor value={form.kitItems} selfId={product?._id} onChange={(kitItems) => setForm((f) => ({ ...f, kitItems }))} />
        )}
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
