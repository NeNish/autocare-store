import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/api';
import ProductArt from '@/components/ProductArt';
import ProductCard from '@/components/ProductCard';
import AddToCartButton from '@/components/AddToCartButton';
import Price from '@/components/lux/Price';

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
        <h2 id="related-title" className="display text-[clamp(2.4rem,5vw,4.5rem)] text-ivory" data-reveal="line">
          <span>From the same <em className="gold-text">line.</em></span>
        </h2>
        <Link href={`/products?q=${encodeURIComponent(product.type)}`} className="link-lux shrink-0">See all →</Link>
      </div>
      <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((p, i) => (
          <ProductCard key={p._id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-12 animate-rise text-[11px] uppercase tracking-[0.3em] text-dim">
        <Link href="/products" className="transition-colors hover:text-gold-light">Collection</Link>
        {product.type && (
          <>
            <span className="mx-3 text-line-strong">/</span>
            <Link href={`/products?q=${encodeURIComponent(product.type)}`} className="transition-colors hover:text-gold-light">
              {product.type}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div className="animate-fade">
          <div data-tilt="5" className="group [perspective:1400px] lg:sticky lg:top-28" style={{ '--rx': '0deg', '--ry': '0deg', '--mx': '50%', '--my': '50%' }}>
            <div
              className="relative aspect-square overflow-hidden rounded-[28px] border border-line transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)]"
              style={{ transform: 'rotateX(var(--rx)) rotateY(var(--ry))' }}
            >
              <ProductArt product={product} />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), #f1dfb824, transparent 60%)' }}
              />
            </div>
          </div>
        </div>

        <div className="lg:pt-6">
          {product.type && <p className="eyebrow animate-rise [animation-delay:80ms]">{product.type}</p>}
          <h1 className="display mt-6 animate-rise text-[clamp(2.8rem,5.2vw,5rem)] text-ivory [animation-delay:160ms]">{product.name}</h1>
          <div className="mt-10 flex animate-rise items-end gap-6 [animation-delay:240ms]">
            <Price value={product.price} className="text-7xl text-gold-light" />
            <p className="pb-2 text-[11px] uppercase tracking-[0.26em] text-dim">Inclusive of all taxes</p>
          </div>

          <p
            className={`mt-6 flex animate-rise items-center gap-3 text-[12px] uppercase tracking-[0.24em] [animation-delay:300ms] ${product.stock < 1 ? 'text-rose-300' : lowStock ? 'text-amber-200' : 'text-emerald-200'}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${product.stock < 1 ? 'bg-rose-300' : lowStock ? 'bg-amber-200' : 'bg-emerald-300'}`} />
            {product.stock < 1 ? 'Currently unavailable' : lowStock ? `Only ${product.stock} remaining` : 'Available · ready to ship'}
          </p>

          {product.stock > 0 && (
            <div className="mt-10 animate-rise [animation-delay:360ms]">
              <AddToCartButton product={product} />
            </div>
          )}

          <div className="hairline mt-14" />

          {product.description && (
            <p className="mt-10 text-[17px] leading-[1.85] text-mute" data-reveal>{product.description}</p>
          )}

          {product.features?.length > 0 && (
            <dl className="mt-12 border-t border-line" data-reveal>
              {product.features.map((f, i) => (
                <div key={f} className="flex items-baseline justify-between gap-6 border-b border-line py-5">
                  <dt className="text-[11px] uppercase tracking-[0.3em] text-dim">Detail 0{i + 1}</dt>
                  <dd className="text-right text-[15px] text-ivory">{f}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-12 grid gap-6 sm:grid-cols-2" data-reveal>
            <div className="card p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Delivery</p>
              <p className="mt-3 text-[14px] leading-relaxed text-mute">Complimentary on orders from ₹999. Cash on delivery.</p>
            </div>
            <div className="card p-6">
              <p className="text-[11px] uppercase tracking-[0.28em] text-gold">Returns</p>
              <p className="mt-3 text-[14px] leading-relaxed text-mute">Pending orders can be cancelled from your account.</p>
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
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[700px]" style={{ background: 'radial-gradient(60% 70% at 20% 10%, #18213a 0%, #07080b 70%)' }} />
      <div className="container-page pb-16 pt-36 sm:pt-40">
        <ProductDetail params={params} />
      </div>
    </div>
  );
}
