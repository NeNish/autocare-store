'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import useHydrated from '@/lib/useHydrated';

function NavLink({ href, children, onClick }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white'}`}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const { user, isAdmin, logout, loading } = useAuth();
  const cart = useCart();
  const count = useHydrated() ? cart.count : 0;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  async function handleLogout() {
    await logout();
    close();
    router.push('/');
  }

  const links = (
    <>
      <NavLink href="/" onClick={close}>Home</NavLink>
      <NavLink href="/products" onClick={close}>Shop</NavLink>
      {user && <NavLink href="/account/orders" onClick={close}>My orders</NavLink>}
      {isAdmin && <NavLink href="/admin" onClick={close}>Admin</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-30 bg-ink text-white shadow">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-ink">A</span>
          AutoCare
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">{links}</nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/cart" className="relative rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10" aria-label={`Cart, ${count} items`}>
            Cart
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-xs font-bold text-ink">
                {count}
              </span>
            )}
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {loading ? null : user ? (
              <>
                <span className="text-sm text-white/70">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:text-white">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:text-white">Log in</Link>
                <Link href="/register" className="btn bg-accent text-ink hover:bg-amber-400">Sign up</Link>
              </>
            )}
          </div>
          <button
            className="rounded-md p-2 hover:bg-white/10 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="container-page flex flex-col gap-1 border-t border-white/10 pb-4 pt-2 md:hidden">
          {links}
          {user ? (
            <button onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm font-medium text-white/80">
              Log out
            </button>
          ) : (
            <>
              <NavLink href="/login" onClick={close}>Log in</NavLink>
              <NavLink href="/register" onClick={close}>Sign up</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
