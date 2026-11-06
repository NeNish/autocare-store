'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import PageShell from '@/components/lux/PageShell';
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
      <div className="mb-10 flex gap-8 border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b py-4 text-[11px] uppercase tracking-[0.3em] transition-colors ${tab === t ? 'border-gold text-gold-light' : 'border-transparent text-mute hover:text-ivory'}`}
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
    <PageShell eyebrow="Atelier admin" title="The" accent="atelier.">
      <RequireAuth admin>
        <Dashboard />
      </RequireAuth>
    </PageShell>
  );
}
