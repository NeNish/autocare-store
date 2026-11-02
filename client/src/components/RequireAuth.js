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

  if (loading || !user) return <p className="py-16 text-center text-slate-500">Loading…</p>;
  if (admin && !isAdmin) {
    return <p className="py-16 text-center text-slate-600">You don&apos;t have access to this page.</p>;
  }
  return children;
}

const Loading = () => <p className="py-16 text-center text-slate-500">Loading…</p>;

export default function RequireAuth({ children, admin = false }) {
  return (
    <Suspense fallback={<Loading />}>
      <Guard admin={admin}>{children}</Guard>
    </Suspense>
  );
}
