'use client';

import { useCallback, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import PageShell from '@/components/lux/PageShell';
import ProductsPanel from '@/components/admin/ProductsPanel';
import OrdersPanel from '@/components/admin/OrdersPanel';
import CategoriesPanel from '@/components/admin/CategoriesPanel';
import FitmentsPanel from '@/components/admin/FitmentsPanel';
import CouponsPanel from '@/components/admin/CouponsPanel';
import RemindersPanel from '@/components/admin/RemindersPanel';
import SettingsPanel from '@/components/admin/SettingsPanel';
import { clientApi } from '@/lib/api';

const TABS = ['Orders', 'Products', 'Promo codes', 'Reminders', 'Vehicle fitments', 'Categories', 'Store settings'];

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
      <div className="mb-10 flex gap-8 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b py-4 text-[11px] uppercase tracking-[0.3em] transition-colors ${tab === t ? 'border-accent text-accent-light' : 'border-transparent text-mute hover:text-frost'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Orders' && <OrdersPanel />}
      {tab === 'Products' && <ProductsPanel categories={categories} />}
      {tab === 'Vehicle fitments' && <FitmentsPanel />}
      {tab === 'Categories' && <CategoriesPanel categories={categories} onChange={loadCategories} />}
      {tab === 'Promo codes' && <CouponsPanel />}
      {tab === 'Reminders' && <RemindersPanel />}
      {tab === 'Store settings' && <SettingsPanel />}
    </>
  );
}

export default function AdminPage() {
  return (
    <PageShell eyebrow="Admin" title="Control" accent="centre.">
      <RequireAuth admin>
        <Dashboard />
      </RequireAuth>
    </PageShell>
  );
}
