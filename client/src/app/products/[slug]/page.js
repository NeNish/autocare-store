import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/api';
import ProductArt from '@/components/ProductArt';
import AddToCartButton from '@/components/AddToCartButton';
import { formatPrice } from '@/lib/format';

async function getProduct(slug) {
  try {
    const { product } = await serverApi(`/products/${encodeURIComponent(slug)}`);
    return product;
  } catch (err) {
    if (err.status === 404 || err.status === 400) return null;
    throw err;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product ? { title: product.name, description: product.description } : { title: 'Product not found' };
}

async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <>
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/products" className="hover:text-brand">Shop</Link>
        {product.category && (
          <>
            {' / '}
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="card aspect-[4/3] overflow-hidden">
          <ProductArt product={product} />
        </div>

        <div>
          {product.type && <p className="text-sm font-semibold uppercase tracking-wide text-brand">{product.type}</p>}
          <h1 className="mt-1 text-3xl font-bold leading-tight">{product.name}</h1>
          <p className="mt-4 text-3xl font-bold">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm text-slate-500">Inclusive of all taxes</p>

          <p className={`mt-4 text-sm font-medium ${product.stock < 1 ? 'text-red-600' : lowStock ? 'text-amber-700' : 'text-green-700'}`}>
            {product.stock < 1 ? 'Out of stock' : lowStock ? `Only ${product.stock} left` : 'In stock'}
          </p>

          {product.stock > 0 && (
            <div className="mt-6">
              <AddToCartButton product={product} />
            </div>
          )}

          {product.description && <p className="mt-8 leading-relaxed text-slate-700">{product.description}</p>}

          {product.features?.length > 0 && (
            <ul className="mt-6 space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-slate-700">
                  <span className="text-brand">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// Render this segment blocking (no loading skeleton) so product details are in the
// initial HTML for search engines. Missing products render not-found.js with noindex.
export const instant = false;

export default async function ProductPage({ params }) {
  return (
    <div className="container-page py-8">
      <ProductDetail params={params} />
    </div>
  );
}
