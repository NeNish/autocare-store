const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatPrice = (n) => inr.format(n || 0);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const FREE_SHIPPING_FROM = 999;
export const SHIPPING_FEE = 79;

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export const STATUS_STYLES = {
  pending: 'border-amber-200/40 text-amber-100',
  processing: 'border-sky-200/40 text-sky-100',
  shipped: 'border-indigo-200/40 text-indigo-100',
  delivered: 'border-emerald-200/40 text-emerald-100',
  cancelled: 'border-white/15 text-dim',
};
