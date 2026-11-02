'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

// false during server render and hydration, true afterwards.
// Use it to gate UI that depends on browser-only state (like the localStorage cart).
export default function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
