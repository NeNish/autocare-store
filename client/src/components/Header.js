'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import useHydrated from '@/lib/useHydrated';

const PRIMARY = [
  { href: '/simulator', label: 'Simulator' },
  { href: '/products', label: 'Products' },
  { href: '/fit', label: 'Find your fit' },
  { href: '/compare', label: 'Compare' },
];

function NavLink({ href, children, onClick, className = '' }) {
  const pathname = usePathname();
  const active = href === pathname || (href !== '/' && !href.startsWith('/#') && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative py-2 text-[11px] uppercase tracking-[0.28em] transition-colors duration-300 ${active ? 'text-accent-light' : 'text-mute hover:text-frost'} ${className}`}
    >
      {children}
      <span
        className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-500 ease-out ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}
      />
    </Link>
  );
}

export default function Header() {
  const auth = useAuth();
  const cart = useCart();
  // The header sits in its own Suspense boundary, so it can hydrate after the
  // session check has finished. Render the server's view until it has hydrated.
  const hydrated = useHydrated();
  const user = hydrated ? auth.user : null;
  const isAdmin = hydrated && auth.isAdmin;
  const loading = !hydrated || auth.loading;
  const { logout } = auth;
  const count = hydrated ? cart.count : 0;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Close the mobile menu whenever the route changes
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    if (open) setOpen(false);
  }
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.push('/');
  }

  const accountLinks = [
    ...(user ? [{ href: '/account/orders', label: 'My orders' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <header
      data-header
      data-scrolled="false"
      className="group/header fixed inset-x-0 top-0 z-40 transition-[background,backdrop-filter,border-color] duration-700 data-[scrolled=true]:border-b data-[scrolled=true]:border-line data-[scrolled=true]:bg-obsidian/70 data-[scrolled=true]:backdrop-blur-2xl"
    >
      <div className="container-page flex h-20 items-center gap-10 transition-[height] duration-700 group-data-[scrolled=true]/header:h-16">
        <Link href="/" className="group flex items-center gap-3" aria-label="AutoCare home">
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true" className="transition-transform duration-700 group-hover:rotate-[-12deg]">
            <circle cx="20" cy="20" r="19" stroke="#c3cad5" strokeOpacity="0.35" />
            <path d="M9 27 Q20 8 31 27" stroke="#eaf6ff" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="20" cy="27" r="1.8" fill="#2f8cff" />
          </svg>
          <span className="font-mono text-[12px] font-medium uppercase tracking-[0.36em] text-frost">AutoCare</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {PRIMARY.map((l) => (
            <NavLink key={l.href} href={l.href}>{l.label}</NavLink>
          ))}
          {accountLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>{l.label}</NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-6">
          <div className="hidden items-center gap-6 lg:flex">
            {loading ? null : user ? (
              <>
                <span className="text-[11px] uppercase tracking-[0.28em] text-dim">{user.name.split(' ')[0]}</span>
                <button onClick={handleLogout} className="text-[11px] uppercase tracking-[0.28em] text-mute transition-colors hover:text-frost">
                  Sign out
                </button>
              </>
            ) : (
              <NavLink href="/login">Sign in</NavLink>
            )}
          </div>
          <Link
            href="/cart"
            data-magnetic="0.3"
            aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}
            className="relative flex h-11 items-center gap-3 rounded-full border border-line-strong px-5 text-[11px] uppercase tracking-[0.28em] text-frost transition-[border-color,transform] duration-500 hover:border-accent/70"
          >
            Bag
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent-light px-1 text-[10px] font-semibold tracking-normal text-obsidian">
              {count}
            </span>
          </Link>
          <button
            type="button"
            className="relative h-11 w-11 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className={`absolute left-2.5 right-2.5 h-px bg-frost transition-transform duration-500 ${open ? 'top-1/2 rotate-45' : 'top-[18px]'}`} />
            <span className={`absolute left-2.5 right-2.5 h-px bg-frost transition-transform duration-500 ${open ? 'top-1/2 -rotate-45' : 'top-[26px]'}`} />
          </button>
        </div>
      </div>

      {/* Mobile: a full-screen editorial menu */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-0 top-20 z-30 overflow-y-auto bg-obsidian/95 backdrop-blur-2xl lg:hidden"
      >
        <nav aria-label="Mobile" className="container-page flex flex-col gap-2 py-10">
          {[...PRIMARY, ...accountLinks].map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="display animate-rise border-b border-line py-5 text-5xl text-frost"
              style={{ animationDelay: `${80 + i * 70}ms` }}
            >
              <span className="mr-4 align-top text-xs tracking-[0.3em] text-accent">0{i + 1}</span>
              {l.label}
            </Link>
          ))}
          <div className="mt-10 flex flex-wrap gap-3">
            {user ? (
              <button onClick={handleLogout} className="btn-secondary">Sign out</button>
            ) : (
              <>
                <Link href="/login" className="btn-secondary" onClick={() => setOpen(false)}>Sign in</Link>
                <Link href="/register" className="btn-primary" onClick={() => setOpen(false)}>Create account</Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
