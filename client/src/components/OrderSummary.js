import { formatPrice, FREE_SHIPPING_FROM, SHIPPING_FEE } from '@/lib/format';

export default function OrderSummary({ subtotal, children }) {
  const shipping = subtotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_FEE;
  return (
    <div className="card h-fit space-y-3 p-6">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Shipping</span>
        <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
      </div>
      {subtotal > 0 && subtotal < FREE_SHIPPING_FROM && (
        <p className="text-xs text-slate-500">Add {formatPrice(FREE_SHIPPING_FROM - subtotal)} more for free shipping.</p>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-3 font-bold">
        <span>Total</span>
        <span>{formatPrice(subtotal + shipping)}</span>
      </div>
      {children}
    </div>
  );
}
