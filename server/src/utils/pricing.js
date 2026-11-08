// Server-side pricing: subtotal → coupon discount → shipping → total.
// Prices are always read from the database, never trusted from the client.
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');

const round2 = (n) => Math.round(n * 100) / 100;

// Returns { coupon, discount } or throws a readable message via { error }
async function evaluateCoupon(code, subtotal, userId) {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() }).lean();
  const now = new Date();
  if (!coupon || !coupon.active) return { error: 'This code is not valid' };
  if (coupon.startsAt && coupon.startsAt > now) return { error: 'This code is not active yet' };
  if (coupon.endsAt && coupon.endsAt < now) return { error: 'This code has expired' };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { error: 'This code has been fully redeemed' };
  if (subtotal < (coupon.minSubtotal || 0)) {
    return { error: `Add items worth ₹${coupon.minSubtotal - subtotal} more to use this code` };
  }
  if (coupon.oncePerCustomer && userId) {
    const used = await Order.exists({
      user: userId,
      'coupon.code': coupon.code,
      status: { $ne: 'cancelled' },
    });
    if (used) return { error: 'You have already used this code' };
  }
  let discount = coupon.kind === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.kind === 'percent' && coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = round2(Math.min(discount, subtotal));
  return { coupon, discount };
}

// shippingFee 0 = shipping is always free; freeShippingFrom 0 = no free-shipping threshold
function shippingFor(amount, settings) {
  const fee = settings.shippingFee || 0;
  const threshold = settings.freeShippingFrom || 0;
  if (fee === 0) return 0;
  return threshold > 0 && amount >= threshold ? 0 : fee;
}

// lines: [{ price, quantity }]
// Whether cash on delivery can be used for an order of this value (before the COD fee)
function codStatus(amount, settings) {
  if (!settings.codEnabled) return { available: false, reason: 'Cash on delivery is not offered right now' };
  if (settings.codMaxOrder > 0 && amount > settings.codMaxOrder) {
    return { available: false, reason: `Cash on delivery is available on orders up to ₹${settings.codMaxOrder}` };
  }
  return { available: true, reason: null };
}

async function quote({ lines, couponCode, userId, settings, paymentMethod = 'online' }) {
  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.quantity, 0));
  let discount = 0;
  let coupon = null;
  let couponError = null;
  if (couponCode) {
    const r = await evaluateCoupon(couponCode, subtotal, userId);
    if (r.error) couponError = r.error;
    else ({ coupon, discount } = r);
  }
  const afterDiscount = round2(subtotal - discount);
  const shipping = lines.length ? shippingFor(afterDiscount, settings) : 0;
  const beforeFees = round2(afterDiscount + shipping);
  const cod = codStatus(beforeFees, settings);
  const codFee = paymentMethod === 'cod' && cod.available ? settings.codFee || 0 : 0;
  return {
    subtotal,
    discount,
    shipping,
    codFee,
    total: round2(beforeFees + codFee),
    cod: { ...cod, fee: settings.codFee || 0 },
    coupon: coupon ? { code: coupon.code, kind: coupon.kind, value: coupon.value, description: coupon.description } : null,
    couponError,
    freeShippingFrom: settings.freeShippingFrom,
    shippingFee: settings.shippingFee,
  };
}

module.exports = { quote, evaluateCoupon, shippingFor, codStatus, round2 };
