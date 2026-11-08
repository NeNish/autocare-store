'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';
import { setCouponCode } from '@/lib/store';
import Price from '@/components/lux/Price';

function CouponField({ quote, code }) {
  const [value, setValue] = useState('');
  if (quote.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3">
        <div className="min-w-0">
          <p className="font-mono text-[12px] tracking-[0.12em] text-ice">{quote.coupon.code}</p>
          {quote.coupon.description && <p className="mt-0.5 truncate text-[12px] text-mute">{quote.coupon.description}</p>}
        </div>
        <button type="button" className="link-tech text-[12px]" onClick={() => setCouponCode('')}>Remove</button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <label htmlFor="coupon" className="sr-only">Promo code</label>
        <input
          id="coupon"
          className="input h-11 flex-1 font-mono uppercase"
          placeholder="Promo code"
          value={value}
          maxLength={30}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (value.trim()) setCouponCode(value.trim().toUpperCase());
            }
          }}
          aria-describedby={code && quote.couponError ? 'coupon-error' : undefined}
        />
        <button type="button" className="btn-secondary h-11 px-5" onClick={() => value.trim() && setCouponCode(value.trim().toUpperCase())}>
          Apply
        </button>
      </div>
      {code && quote.couponError && (
        <p id="coupon-error" role="alert" className="mt-2 text-[12px] text-rose-200">
          {code}: {quote.couponError}
        </p>
      )}
    </div>
  );
}

export default function OrderSummary({ quote, loading, code, children, showCoupon = true }) {
  const { subtotal, discount, shipping, total, freeShippingFrom } = quote;
  const afterDiscount = subtotal - discount;
  const toFree = freeShippingFrom > 0 && shipping > 0 ? freeShippingFrom - afterDiscount : 0;
  return (
    <div className="glass h-fit space-y-5 rounded-[24px] p-8 lg:sticky lg:top-28" aria-busy={loading}>
      <h2 className="display text-3xl text-frost">Summary</h2>
      <div className="hairline" />
      <div className="flex justify-between text-[14px] text-mute">
        <span>Subtotal</span>
        <span className="tabular-nums text-frost">{formatPrice(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-[14px] text-mute">
          <span>Discount{quote.coupon ? ` (${quote.coupon.code})` : ''}</span>
          <span className="tabular-nums text-accent-light">−{formatPrice(discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-[14px] text-mute">
        <span>Delivery</span>
        <span className="tabular-nums text-frost">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
      </div>
      {toFree > 0 && (
        <div>
          <p className="text-[12px] text-dim">Add {formatPrice(toFree)} more for free delivery.</p>
          <div className="mt-3 h-px w-full bg-line">
            <div className="h-px bg-accent transition-[width] duration-700" style={{ width: `${Math.min(100, (afterDiscount / freeShippingFrom) * 100)}%` }} />
          </div>
        </div>
      )}
      {showCoupon && <CouponField quote={quote} code={code} />}
      <div className="flex items-baseline justify-between border-t border-line pt-5">
        <span className="text-[11px] uppercase tracking-[0.3em] text-mute">Total</span>
        <Price value={total} className="text-5xl text-accent-light" />
      </div>
      {children}
    </div>
  );
}
