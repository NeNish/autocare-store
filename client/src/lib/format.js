const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (n) => inr.format(n || 0);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// Defaults only; the live values come from GET /api/settings/public (Admin → Store settings)
export const DEFAULT_SETTINGS = { shippingFee: 79, freeShippingFrom: 999, remindersEnabled: true, reminderMonths: 6, paymentsEnabled: true, codEnabled: true, codFee: 0, codMaxOrder: 0 };

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const STATUS_LABELS = {
  awaiting_payment: 'Awaiting payment',
  pending: 'Paid',
  processing: 'Packing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STATUS_STYLES = {
  awaiting_payment: 'border-amber-200/40 text-amber-100',
  pending: 'border-emerald-200/40 text-emerald-100',
  processing: 'border-sky-200/40 text-sky-100',
  shipped: 'border-indigo-200/40 text-indigo-100',
  delivered: 'border-accent/50 text-accent-light',
  cancelled: 'border-white/15 text-dim',
};

export const shippingFor = (amount, s) => {
  if (!s.shippingFee) return 0;
  return s.freeShippingFrom > 0 && amount >= s.freeShippingFrom ? 0 : s.shippingFee;
};
