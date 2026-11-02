import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page or product you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/products" className="btn-primary mt-6">Back to shop</Link>
    </div>
  );
}
