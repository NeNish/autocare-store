import Link from 'next/link';
import ProductArt from './ProductArt';
import AddToCartButton from './AddToCartButton';
import { formatPrice } from '@/lib/format';

export default function ProductCard({ product }) {
  const outOfStock = product.stock < 1;
  return (
    <article className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block aspect-[4/3] overflow-hidden">
        <ProductArt product={product} />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.type && (
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">{product.type}</span>
        )}
        <Link href={`/products/${product.slug}`} className="font-semibold leading-snug hover:text-brand">
          {product.name}
        </Link>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {outOfStock ? (
            <span className="text-sm font-medium text-red-600">Out of stock</span>
          ) : (
            <AddToCartButton product={product} compact />
          )}
        </div>
      </div>
    </article>
  );
}
