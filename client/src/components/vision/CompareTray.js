'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare, COMPARE_MAX } from '@/context/CompareContext';
import useHydrated from '@/lib/useHydrated';

// A slim floating bar while products are selected for comparison.
export default function CompareTray() {
  const { items, remove, clear } = useCompare();
  const hydrated = useHydrated();
  const pathname = usePathname();
  if (!hydrated || items.length === 0 || pathname === '/compare') return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 sm:bottom-5 sm:pr-56" role="region" aria-label="Products selected for comparison">
      <div className="glass flex max-w-[760px] flex-wrap items-center gap-3 rounded-full py-2 pl-5 pr-2 animate-rise">
        <span className="hud text-accent-light">Compare {items.length}/{COMPARE_MAX}</span>
        <ul className="flex flex-wrap gap-2">
          {items.map((i) => (
            <li key={i.slug} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[12px] text-frost">
              <span className="max-w-[150px] truncate">{i.name}</span>
              <button onClick={() => remove(i.slug)} aria-label={`Remove ${i.name} from comparison`} className="text-dim hover:text-frost">×</button>
            </li>
          ))}
        </ul>
        <button onClick={clear} className="hud px-2 hover:text-frost">Clear</button>
        <Link href="/compare" className="btn-primary h-10 px-5" aria-disabled={items.length < 2}>
          Compare
        </Link>
      </div>
    </div>
  );
}
