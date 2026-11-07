'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

// Up to three products to compare side by side, kept in the browser.
const KEY = 'autocare-compare';
export const COMPARE_MAX = 3;
const EMPTY = [];
const listeners = new Set();
let cache = null;

const load = () => {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY)) || EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
};
const write = (next) => {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* in-memory only */
  }
  listeners.forEach((l) => l());
};
const subscribe = (l) => {
  listeners.add(l);
  const onStorage = (e) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
};

const Ctx = createContext(null);

export function CompareProvider({ children }) {
  const snap = useSyncExternalStore(subscribe, load, () => null);
  const items = snap || EMPTY;

  const toggle = useCallback((p) => {
    const cur = load();
    if (cur.some((i) => i.slug === p.slug)) return write(cur.filter((i) => i.slug !== p.slug));
    if (cur.length >= COMPARE_MAX) return false;
    write([...cur, { slug: p.slug, name: p.name, type: p.type }]);
    return true;
  }, []);
  const remove = useCallback((slug) => write(load().filter((i) => i.slug !== slug)), []);
  const clear = useCallback(() => write(EMPTY), []);

  const value = useMemo(
    () => ({ items, ready: snap !== null, has: (slug) => items.some((i) => i.slug === slug), full: items.length >= COMPARE_MAX, toggle, remove, clear }),
    [items, snap, toggle, remove, clear]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCompare must be used inside CompareProvider');
  return c;
}
