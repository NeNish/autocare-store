'use client';

// Store settings, coupon code and live server pricing for the bag and checkout
import { useEffect, useState, useSyncExternalStore } from 'react';
import { clientApi } from '@/lib/api';
import { DEFAULT_SETTINGS, shippingFor } from '@/lib/format';

let settingsCache = null;
let settingsPromise = null;
function loadSettings() {
  if (!settingsPromise) {
    settingsPromise = clientApi('/settings/public')
      .then(({ settings }) => (settingsCache = settings))
      .catch(() => (settingsCache = DEFAULT_SETTINGS));
  }
  return settingsPromise;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState(settingsCache);
  useEffect(() => {
    let live = true;
    loadSettings().then((s) => live && setSettings(s));
    return () => {
      live = false;
    };
  }, []);
  return settings || DEFAULT_SETTINGS;
}

// Coupon code kept for the browser session, shared by the bag and checkout
const KEY = 'autocare-coupon';
const listeners = new Set();
const readCode = () => {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
};
export function setCouponCode(code) {
  try {
    if (code) sessionStorage.setItem(KEY, code);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}
export function useCouponCode() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readCode,
    () => ''
  );
}

// Server quote for the current bag; falls back to a local estimate while loading
export function useQuote(items, couponCode) {
  const settings = useStoreSettings();
  const key = JSON.stringify([items.map((i) => [i.productId, i.quantity]), couponCode]);
  const [result, setResult] = useState({ key: null, quote: null });

  useEffect(() => {
    if (!items.length) return;
    let live = true;
    const t = setTimeout(() => {
      clientApi('/orders/quote', {
        method: 'POST',
        body: { items: items.map((i) => ({ product: i.productId, quantity: i.quantity })), couponCode: couponCode || undefined },
      })
        .then(({ quote }) => live && setResult({ key, quote }))
        .catch(() => live && setResult({ key, quote: null }));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // key captures items and coupon
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const estimate = {
    subtotal,
    discount: 0,
    shipping: items.length ? shippingFor(subtotal, settings) : 0,
    total: subtotal + (items.length ? shippingFor(subtotal, settings) : 0),
    coupon: null,
    couponError: null,
    freeShippingFrom: settings.freeShippingFrom,
    shippingFee: settings.shippingFee,
  };
  const fresh = result.key === key && result.quote;
  return { quote: fresh ? result.quote : estimate, loading: !fresh && items.length > 0, settings };
}
