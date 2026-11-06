'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Client-side guard for pages that need a signed-in user (the API enforces this too).
function Guard({ children, admin }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (loading || !user) return <p className="py-24 text-center text-[11px] uppercase tracking-[0.34em] text-dim">Loading…</p>;
  if (admin && !isAdmin) {
    return <p className="display py-24 text-center text-4xl text-mute">This room is reserved for the atelier.</p>;
  }
  return children;
}

const Loading = () => <p className="py-24 text-center text-[11px] uppercase tracking-[0.34em] text-dim">Loading…</p>;

export default function RequireAuth({ children, admin = false }) {
  return (
    <Suspense fallback={<Loading />}>
      <Guard admin={admin}>{children}</Guard>
    </Suspense>
  );
}
