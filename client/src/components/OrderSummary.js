import { formatPrice, FREE_SHIPPING_FROM, SHIPPING_FEE } from '@/lib/format';
import Price from '@/components/lux/Price';

export default function OrderSummary({ subtotal, children }) {
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FEE;
  const toFree = FREE_SHIPPING_FROM - subtotal;
  return (
    <div className="glass h-fit space-y-5 rounded-[24px] p-8 lg:sticky lg:top-28">
      <h2 className="display text-3xl text-ivory">Summary</h2>
      <div className="hairline" />
      <div className="flex justify-between text-[14px] text-mute">
        <span>Subtotal</span>
        <span className="tabular-nums text-ivory">{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-[14px] text-mute">
        <span>Delivery</span>
        <span className="tabular-nums text-ivory">{shipping === 0 ? 'Complimentary' : formatPrice(shipping)}</span>
      </div>
      {subtotal > 0 && toFree > 0 && (
        <div>
          <p className="text-[12px] text-dim">Add {formatPrice(toFree)} more for complimentary delivery.</p>
          <div className="mt-3 h-px w-full bg-line">
            <div className="h-px bg-gold transition-[width] duration-700" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100)}%` }} />
          </div>
        </div>
      )}
      <div className="flex items-baseline justify-between border-t border-line pt-5">
        <span className="text-[11px] uppercase tracking-[0.3em] text-mute">Total</span>
        <Price value={subtotal + shipping} className="text-5xl text-gold-light" />
      </div>
      {children}
    </div>
  );
}
