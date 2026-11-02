'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import ProductsPanel from '@/components/admin/ProductsPanel';
import OrdersPanel from '@/components/admin/OrdersPanel';
import CategoriesPanel from '@/components/admin/CategoriesPanel';
import { clientApi } from '@/lib/api';

const TABS = ['Orders', 'Products', 'Categories'];

function Dashboard() {
  const [tab, setTab] = useState('Orders');
  const [categories, setCategories] = useState([]);

  const loadCategories = useCallback(
    () => clientApi('/categories').then((d) => setCategories(d.categories)).catch(() => {}),
    []
  );

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <>
      <div className="mb-6 flex gap-1 border-b border-slate-200" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-600 hover:text-ink'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Orders' && <OrdersPanel />}
      {tab === 'Products' && <ProductsPanel categories={categories} />}
      {tab === 'Categories' && <CategoriesPanel categories={categories} onChange={loadCategories} />}
    </>
  );
}

export default function AdminPage() {
  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-bold">Admin</h1>
      <RequireAuth admin>
        <Dashboard />
      </RequireAuth>
    </div>
  );
}
