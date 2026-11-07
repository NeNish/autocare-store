import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import AddToCartButton from '@/components/AddToCartButton';
import Price from '@/components/lux/Price';
import ProductViewer from '@/components/vision/ProductViewer';
import CompareButton from '@/components/vision/CompareButton';

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

async function Related({ product }) {
  if (!product.type) return null;
  const { products } = await serverApi(`/products?q=${encodeURIComponent(product.type)}&limit=4`);
  const others = products.filter((p) => p._id !== product._id).slice(0, 3);
  if (!others.length) return null;
  return (
    <section aria-labelledby="related-title" className="mt-40">
      <div className="mb-14 flex items-end justify-between gap-6">
        <h2 id="related-title" className="display text-[clamp(2.4rem,5vw,4.5rem)]" data-reveal="line">
          <span><span className="chrome-text">Also in</span> <span className="accent-text">{product.type.toLowerCase()}.</span></span>
        </h2>
        <Link href={`/products?q=${encodeURIComponent(product.type)}`} className="link-tech shrink-0">See all →</Link>
      </div>
      <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((p, i) => (
          <ProductCard key={p._id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function SpecTable({ product }) {
  // Only data stored for this product: nothing inferred or invented
  const rows = [
    ['Product line', product.type],
    ['Blade lengths', product.bladeLengthsIn?.length ? [...product.bladeLengthsIn].sort((a, b) => b - a).map((n) => `${n} in`).join(' + ') : null],
    ['Arm connectors', product.connectors?.length ? product.connectors.join(' / ') : null],
    ...(product.features || []).map((f, i) => [`Feature ${String(i + 1).padStart(2, '0')}`, f]),
    ['Category', product.category ? `${product.category.number ? `${product.category.number}. ` : ''}${product.category.name}` : null],
  ].filter(([, v]) => v);
  return (
    <section aria-labelledby="spec-title" className="mt-14" data-reveal>
      <h2 id="spec-title" className="hud text-accent-light">Technical specification</h2>
      <dl className="mt-5 border-t border-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[150px_1fr] gap-6 border-b border-line py-4">
            <dt className="hud self-center">{k}</dt>
            <dd className="text-[15px] text-frost">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const lowStock = product.stock > 0 && product.stock <= 10;
  const sizes = product.bladeLengthsIn?.length === 2 ? [...product.bladeLengthsIn].sort((a, b) => b - a) : null;

  return (
    <>
      <nav aria-label="Breadcrumb" className="hud mb-12 animate-rise">
        <Link href="/products" className="transition-colors hover:text-ice">Products</Link>
        {product.type && (
          <>
            <span className="mx-3 text-line-strong">/</span>
            <Link href={`/products?q=${encodeURIComponent(product.type)}`} className="transition-colors hover:text-ice">{product.type}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div className="animate-fade">
          <div className="lg:sticky lg:top-28">
            <ProductViewer product={product} />
          </div>
        </div>

        <div className="lg:pt-4">
          {product.type && <p className="eyebrow animate-rise [animation-delay:80ms]">{product.type}</p>}
          <h1 className="display chrome-text mt-6 animate-rise text-[clamp(2.6rem,4.8vw,4.6rem)] [animation-delay:160ms]">{product.name}</h1>
          <div className="mt-10 flex animate-rise items-end gap-6 [animation-delay:240ms]">
            <Price value={product.price} className="text-7xl text-ice" />
            <p className="hud pb-2">Inclusive of all taxes</p>
          </div>

          <p
            className={`mt-6 flex animate-rise items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] [animation-delay:300ms] ${product.stock < 1 ? 'text-rose-300' : lowStock ? 'text-amber-200' : 'text-emerald-200'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${product.stock < 1 ? 'bg-rose-300' : lowStock ? 'bg-amber-200' : 'bg-emerald-300'}`} />
            {product.stock < 1 ? 'Currently unavailable' : lowStock ? `Only ${product.stock} remaining` : 'In stock · ready to ship'}
          </p>

          {product.stock > 0 && (
            <div className="mt-10 animate-rise [animation-delay:360ms]">
              <AddToCartButton product={product} />
            </div>
          )}
          <div className="mt-6 flex animate-rise flex-wrap items-center gap-3 [animation-delay:420ms]">
            <CompareButton product={product} />
            {sizes && (
              <Link href={`/fit?tab=measure&driver=${sizes[0]}&passenger=${sizes[1]}`} className="chip border-line text-mute hover:border-accent/60 hover:text-ice">
                Check vehicle fit →
              </Link>
            )}
          </div>

          {product.description && <p className="mt-12 text-[17px] leading-[1.85] text-mute" data-reveal>{product.description}</p>}
          <SpecTable product={product} />

          <div className="mt-12 grid gap-4 sm:grid-cols-2" data-reveal>
            <div className="card p-6">
              <p className="hud text-accent-light">Delivery</p>
              <p className="mt-3 text-[14px] leading-relaxed text-mute">Free on orders from ₹999. Cash on delivery.</p>
            </div>
            <div className="card p-6">
              <p className="hud text-accent-light">Questions?</p>
              <p className="mt-3 text-[14px] leading-relaxed text-mute">Ask the care assistant (bottom right) about fit, use or troubleshooting.</p>
            </div>
          </div>
        </div>
      </div>

      <Related product={product} />
    </>
  );
}

// Render this segment blocking (no loading skeleton) so product details are in the
// initial HTML for search engines. Missing products render not-found.js with noindex.
export const instant = false;

export default async function ProductPage({ params }) {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[700px]" style={{ background: 'radial-gradient(60% 70% at 20% 10%, #0c1a30 0%, #050608 70%)' }} />
      <div className="container-page pb-16 pt-36 sm:pt-40">
        <ProductDetail params={params} />
      </div>
    </div>
  );
}
