import { formatPrice } from '@/lib/format';

// Large editorial prices: lining serif numerals with a small raised rupee sign,
// as on a printed price card. Screen readers hear the plain formatted price.
export default function Price({ value, className = '' }) {
  const text = formatPrice(value);
  const amount = text.replace(/^[^\d]+/, '');
  return (
    <span className={`display inline-flex items-start tabular-nums ${className}`} aria-label={text}>
      <span aria-hidden="true" className="mr-[0.08em] mt-[0.22em] font-sans text-[0.38em] font-light not-italic">₹</span>
      <span aria-hidden="true">{amount}</span>
    </span>
  );
}
