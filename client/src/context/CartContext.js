'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

// Cart lines: { productId, slug, name, price, type, stock, quantity }
// Prices here are for display only; the API recalculates totals from the database.

const STORAGE_KEY = 'autocare-cart';
const EMPTY = [];
const listeners = new Set();
let cache = null; // parsed items, loaded lazily in the browser

function load() {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  // Keep tabs in sync
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const getSnapshot = () => load();
const getServerSnapshot = () => null; // null = not yet hydrated

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = snapshot !== null;
  const items = snapshot || EMPTY;

  const update = useCallback((fn) => write(fn(load())), []);

  const add = useCallback(
    (product, quantity = 1) =>
      update((prev) => {
        const max = Math.min(product.stock, 99);
        const existing = prev.find((i) => i.productId === product._id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product._id ? { ...i, stock: product.stock, quantity: Math.min(i.quantity + quantity, max) } : i
          );
        }
        return [
          ...prev,
          {
            productId: product._id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            type: product.type,
            stock: product.stock,
            quantity: Math.min(quantity, max),
          },
        ];
      }),
    [update]
  );

  const setQuantity = useCallback(
    (productId, quantity) =>
      update((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock, 99)) } : i))
      ),
    [update]
  );

  const remove = useCallback((productId) => update((prev) => prev.filter((i) => i.productId !== productId)), [update]);
  const clear = useCallback(() => write(EMPTY), []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
    return { items, ready, count, subtotal, add, setQuantity, remove, clear };
  }, [items, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
