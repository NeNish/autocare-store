'use client';

import { useEffect, useState } from 'react';
import ProductForm from './ProductForm';
import { clientApi, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';

export default function ProductsPanel({ categories }) {
  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [error, setError] = useState('');

  const load = () =>
    clientApi('/products?all=true&limit=100&sort=name')
      .then((d) => setProducts(d.products))
      .catch((e) => setError(errorMessage(e)));

  useEffect(() => {
    load();
  }, []);

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await clientApi(`/products/${p._id}`, { method: 'DELETE' });
      setProducts((list) => list.filter((x) => x._id !== p._id));
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (editing) {
    return (
      <ProductForm
        product={editing === 'new' ? null : editing}
        categories={categories}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mute">{products ? `${products.length} products` : 'Loading…'}</p>
        <button className="btn-primary" onClick={() => setEditing('new')} disabled={categories.length === 0}>
          + Add product
        </button>
      </div>
      {categories.length === 0 && <p className="text-sm text-amber-200">Create a category first.</p>}
      {error && <p className="text-sm text-rose-200">{error}</p>}
      {products && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-white/[0.03] text-xs uppercase text-dim">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-mute">{p.type}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(p.price)}</td>
                  <td className={`px-4 py-3 text-right ${p.stock <= 10 ? 'font-semibold text-amber-200' : ''}`}>{p.stock}</td>
                  <td className="px-4 py-3">{p.isActive ? 'Visible' : <span className="text-dim">Hidden</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-3 text-gold hover:underline" onClick={() => setEditing(p)}>Edit</button>
                    <button className="text-rose-200 hover:underline" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
