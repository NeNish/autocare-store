import Link from 'next/link';
import ProductArt from './ProductArt';
import AddToCartButton from './AddToCartButton';
import { formatPrice } from '@/lib/format';

export default function ProductCard({ product, index = 0 }) {
  const outOfStock = product.stock < 1;
  return (
    <article className="group relative" data-reveal style={{ '--delay': `${(index % 3) * 120}ms` }}>
      <Link href={`/products/${product.slug}`} data-cursor="View" className="block" aria-label={product.name}>
        <div data-tilt="6" className="[perspective:1200px]" style={{ '--rx': '0deg', '--ry': '0deg', '--mx': '50%', '--my': '50%' }}>
          <div
            className="relative aspect-[4/4.6] overflow-hidden rounded-[22px] border border-line transition-[transform,border-color] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:border-gold/40"
            style={{ transform: 'rotateX(var(--rx)) rotateY(var(--ry))' }}
          >
            <div className="h-full w-full transition-transform duration-[1400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.05]">
              <ProductArt product={product} />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              style={{ background: 'radial-gradient(320px circle at var(--mx) var(--my), #f1dfb822, transparent 65%)' }}
            />
            {product.type && (
              <span className="absolute left-5 top-5 text-[10px] uppercase tracking-[0.32em] text-gold-light/80">{product.type}</span>
            )}
            {outOfStock && (
              <span className="glass absolute right-5 top-4 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-rose-200">
                Sold out
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-6 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link
            href={`/products/${product.slug}`}
            className="display block text-[1.65rem] leading-[1.15] text-ivory transition-colors duration-300 hover:text-gold-light"
          >
            {product.name}
          </Link>
          <p className="mt-3 text-[15px] tabular-nums text-gold-light">{formatPrice(product.price)}</p>
        </div>
        <div className="shrink-0 pt-2">{!outOfStock && <AddToCartButton product={product} compact />}</div>
      </div>
    </article>
  );
}
