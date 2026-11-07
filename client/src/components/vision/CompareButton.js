'use client';

import { useCompare } from '@/context/CompareContext';
import useHydrated from '@/lib/useHydrated';

export default function CompareButton({ product, className = '' }) {
  const { has, toggle, full } = useCompare();
  const hydrated = useHydrated();
  const on = hydrated && has(product.slug);
  const disabled = hydrated && !on && full;
  return (
    <button
      type="button"
      onClick={() => toggle(product)}
      disabled={disabled}
      aria-pressed={on}
      title={disabled ? 'You can compare up to 3 products' : undefined}
      className={`chip ${on ? 'border-accent bg-accent/15 text-ice' : 'border-line text-mute hover:border-line-strong hover:text-frost'} disabled:opacity-40 ${className}`}
    >
      <span aria-hidden="true" className={`grid h-4 w-4 place-items-center rounded-[4px] border ${on ? 'border-accent bg-accent text-white' : 'border-line-strong'}`}>
        {on ? '✓' : ''}
      </span>
      {on ? 'Comparing' : 'Compare'}
    </button>
  );
}
