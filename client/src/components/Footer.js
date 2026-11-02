import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-ink">AutoCare</span> · Windshield care and wiper blades, delivered.
        </p>
        <nav className="flex gap-4">
          <Link href="/products" className="hover:text-brand">Shop</Link>
          <Link href="/cart" className="hover:text-brand">Cart</Link>
          <Link href="/account/orders" className="hover:text-brand">Orders</Link>
        </nav>
      </div>
    </footer>
  );
}
