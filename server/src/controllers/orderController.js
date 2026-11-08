const { matchedData } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const Reminder = require('../models/Reminder');
const ApiError = require('../utils/ApiError');
const razorpay = require('../utils/razorpay');
const { quote } = require('../utils/pricing');
const { paymentWindowMin, storeName } = require('../config/env');

const toPaise = (inr) => Math.round(inr * 100);

async function restock(items) {
  await Promise.all(
    items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
  );
}

async function releaseCoupon(order) {
  if (order.coupon?.code) {
    await Coupon.updateOne({ code: order.coupon.code, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  }
}

// Reserve stock atomically per line; rolls back everything if any line fails
async function reserveStock(lines) {
  const reserved = [];
  try {
    for (const [productId, quantity] of lines) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      ).lean();
      if (!product) {
        const exists = await Product.findById(productId).select('name stock isActive').lean();
        if (!exists || !exists.isActive) throw ApiError.badRequest('A product in your cart is no longer available');
        throw ApiError.badRequest(`Only ${exists.stock} left of "${exists.name}"`);
      }
      reserved.push({ product: product._id, name: product.name, price: product.price, quantity, type: product.type });
    }
  } catch (err) {
    await restock(reserved);
    throw err;
  }
  return reserved;
}

// Cancels an unpaid order and gives its stock and coupon back. Atomic, so it runs once.
async function releaseUnpaid(orderId, reason) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: 'awaiting_payment', 'payment.status': { $ne: 'paid' } },
    { status: 'cancelled', cancelReason: reason },
    { new: true }
  );
  if (!order) return null;
  await restock(order.items);
  await releaseCoupon(order);
  return order;
}

// Unpaid orders hold stock only for the payment window
async function releaseExpired() {
  const cutoff = new Date(Date.now() - paymentWindowMin * 60 * 1000);
  const stale = await Order.find({ status: 'awaiting_payment', createdAt: { $lt: cutoff } }).select('_id').lean();
  for (const o of stale) await releaseUnpaid(o._id, 'Payment not completed in time');
  return stale.length;
}

function checkoutFor(order, user) {
  return {
    keyId: razorpay.keyId(),
    razorpayOrderId: order.payment.razorpayOrderId,
    amount: toPaise(order.total),
    currency: 'INR',
    name: storeName,
    description: `Order ${String(order._id).slice(-8).toUpperCase()}`,
    prefill: { name: order.shippingAddress.fullName, email: user?.email, contact: order.shippingAddress.phone },
    expiresAt: new Date(new Date(order.createdAt).getTime() + paymentWindowMin * 60 * 1000),
  };
}

async function scheduleReminder(order) {
  if (!order.reminderOptIn) return;
  const settings = await Settings.get();
  if (!settings.remindersEnabled) return;
  const ids = order.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids } })
    .select('name type kitItems')
    .populate('kitItems.product', 'type')
    .lean();
  const hasBlades = (p) => p.type === 'Wiper Blades' || (p.kitItems || []).some((k) => k.product?.type === 'Wiper Blades');
  const blades = products.filter(hasBlades);
  if (!blades.length) return;
  const populated = await Order.findById(order._id).populate('user', 'email name').lean();
  const dueAt = new Date(order.payment.paidAt || Date.now());
  dueAt.setMonth(dueAt.getMonth() + settings.reminderMonths);
  await Reminder.updateOne(
    { order: order._id },
    {
      $setOnInsert: {
        user: populated.user._id,
        email: populated.user.email,
        name: populated.user.name,
        products: blades.map((b) => b.name),
        dueAt,
      },
    },
    { upsert: true }
  );
}

// Confirms a payment against Razorpay (never trusting the browser alone), captures it if needed,
// and marks the order paid. Safe to call more than once (checkout callback and webhook).
async function confirmPayment(order, paymentId) {
  if (order.payment?.status === 'paid') {
    if (order.payment.razorpayPaymentId === paymentId) return order;
    throw ApiError.conflict('This order has already been paid');
  }
  const expected = toPaise(order.total);
  let payment = await razorpay.fetchPayment(paymentId);
  if (payment.order_id !== order.payment.razorpayOrderId || payment.amount !== expected || payment.currency !== 'INR') {
    throw ApiError.badRequest('Payment does not match this order');
  }
  if (payment.status === 'authorized') payment = await razorpay.capturePayment(paymentId, expected);
  if (payment.status !== 'captured') {
    await Order.updateOne(
      { _id: order._id, 'payment.status': 'unpaid' },
      { 'payment.failureReason': payment.error_description || `Payment ${payment.status}` }
    );
    throw ApiError.badRequest('The payment was not completed. You have not been charged.');
  }

  const paidFields = {
    'payment.status': 'paid',
    'payment.razorpayPaymentId': paymentId,
    'payment.method': payment.method,
    'payment.paidAt': new Date(),
    'payment.failureReason': undefined,
  };

  let updated = await Order.findOneAndUpdate(
    { _id: order._id, status: 'awaiting_payment', 'payment.status': { $ne: 'paid' } },
    { ...paidFields, status: 'pending' },
    { new: true }
  );

  if (!updated) {
    const current = await Order.findById(order._id);
    if (current.payment?.status === 'paid') return current; // confirmed concurrently
    if (current.status === 'cancelled') {
      // Paid after the hold expired: take the stock again, or refund in full
      try {
        await reserveStock(current.items.map((i) => [String(i.product), i.quantity]));
        updated = await Order.findOneAndUpdate(
          { _id: current._id, status: 'cancelled', 'payment.status': { $ne: 'paid' } },
          { ...paidFields, status: 'pending', cancelReason: undefined },
          { new: true }
        );
        if (!updated) {
          await restock(current.items);
          return Order.findById(order._id);
        }
      } catch {
        const refund = await razorpay.refundPayment(paymentId, expected);
        return Order.findByIdAndUpdate(
          current._id,
          {
            'payment.status': 'refunded',
            'payment.razorpayPaymentId': paymentId,
            'payment.refundId': refund.id,
            cancelReason: 'Paid after the reservation expired and an item sold out; refunded in full',
          },
          { new: true }
        );
      }
    } else {
      return current;
    }
  }

  await scheduleReminder(updated).catch((err) => console.error('Reminder not scheduled:', err.message));
  return updated;
}

// Refunds (if paid), cancels, restocks
async function cancelOrder(order, reason) {
  if (order.status === 'awaiting_payment' && order.payment?.status !== 'paid') {
    const released = await releaseUnpaid(order._id, reason);
    if (!released) throw ApiError.conflict('Order was changed; reload and retry');
    return released;
  }
  // Claim the order first so a second click cannot refund twice
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { status: 'cancelled', cancelReason: reason },
    { new: true }
  );
  if (!claimed) throw ApiError.conflict('Order was changed by someone else; reload and retry');
  if (claimed.payment?.status === 'paid' && claimed.paymentMethod === 'cod') {
    claimed.cancelReason = `${reason}. Cash was collected on delivery; refund it to the customer directly.`;
    await claimed.save();
  }
  if (claimed.payment?.status === 'paid' && claimed.payment.razorpayPaymentId) {
    try {
      const refund = await razorpay.refundPayment(claimed.payment.razorpayPaymentId, toPaise(claimed.total));
      claimed.payment.status = 'refunded';
      claimed.payment.refundId = refund.id;
      await claimed.save();
    } catch (err) {
      await Order.updateOne({ _id: claimed._id }, { status: order.status, cancelReason: undefined });
      throw err;
    }
  }
  await restock(claimed.items);
  await releaseCoupon(claimed);
  await Reminder.updateOne({ order: claimed._id, status: 'scheduled' }, { status: 'cancelled' });
  return claimed;
}

function mergeLines(items) {
  const merged = new Map();
  for (const { product, quantity } of items) merged.set(product, (merged.get(product) || 0) + quantity);
  return merged;
}

// POST /api/orders/quote — price a cart (and an optional coupon) without reserving anything
exports.quote = async (req, res) => {
  const { items, couponCode, paymentMethod } = matchedData(req, { locations: ['body'] });
  const merged = mergeLines(items);
  const products = await Product.find({ _id: { $in: [...merged.keys()] }, isActive: true }).select('price').lean();
  const lines = products.map((p) => ({ price: p.price, quantity: merged.get(String(p._id)) }));
  const settings = await Settings.get();
  const q = await quote({ lines, couponCode, userId: req.user?._id, settings, paymentMethod });
  res.json({ success: true, quote: { ...q, onlineAvailable: razorpay.configured() } });
};

// POST /api/orders — reserves stock and prices the order on the server.
// Online: opens a Razorpay order for the customer to pay. Cash on delivery: confirmed straight away.
exports.create = async (req, res) => {
  const { items, shippingAddress, couponCode, reminderOptIn, paymentMethod = 'online' } = matchedData(req, { locations: ['body'] });
  const cod = paymentMethod === 'cod';
  if (!cod && !razorpay.configured()) {
    throw new ApiError(503, 'Online payments are not set up yet. Please choose cash on delivery or try again later.');
  }
  await releaseExpired();

  const reserved = await reserveStock(mergeLines(items));
  let couponClaimed = null;
  let order;
  try {
    const settings = await Settings.get();
    const q = await quote({ lines: reserved, couponCode, userId: req.user._id, settings, paymentMethod });
    if (couponCode && q.couponError) throw ApiError.badRequest(q.couponError);
    if (cod && !q.cod.available) throw ApiError.badRequest(q.cod.reason);

    if (q.coupon) {
      const coupon = await Coupon.findOne({ code: q.coupon.code }).lean();
      const filter = { _id: coupon._id, active: true };
      if (coupon.usageLimit) filter.usedCount = { $lt: coupon.usageLimit };
      const claimed = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } });
      if (!claimed.modifiedCount) throw ApiError.badRequest('This code has been fully redeemed');
      couponClaimed = q.coupon.code;
    }

    order = await Order.create({
      user: req.user._id,
      items: reserved.map(({ type: _t, ...line }) => line),
      shippingAddress,
      subtotal: q.subtotal,
      discount: q.discount,
      coupon: q.coupon ? { code: q.coupon.code, kind: q.coupon.kind, value: q.coupon.value } : undefined,
      shipping: q.shipping,
      codFee: q.codFee,
      total: q.total,
      paymentMethod,
      status: cod ? 'pending' : 'awaiting_payment',
      payment: { provider: cod ? 'cod' : 'razorpay', status: 'unpaid' },
      reminderOptIn: Boolean(reminderOptIn),
    });

    if (cod) {
      await scheduleReminder(order).catch((e) => console.error('Reminder not scheduled:', e.message));
      return res.status(201).json({ success: true, order, checkout: null });
    }

    const rzp = await razorpay.createOrder({
      amountPaise: toPaise(order.total),
      receipt: String(order._id),
      notes: { orderId: String(order._id) },
    });
    order.payment.razorpayOrderId = rzp.id;
    await order.save();
  } catch (err) {
    await restock(reserved);
    if (couponClaimed) await Coupon.updateOne({ code: couponClaimed, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    if (order) await Order.deleteOne({ _id: order._id });
    throw err;
  }

  res.status(201).json({ success: true, order, checkout: checkoutFor(order, req.user) });
};

// POST /api/orders/:id/pay — reopen checkout for an order that is still awaiting payment
exports.pay = async (req, res) => {
  await releaseExpired();
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== 'awaiting_payment' || !order.payment?.razorpayOrderId) {
    throw ApiError.badRequest('This order is not waiting for payment');
  }
  res.json({ success: true, checkout: checkoutFor(order, req.user) });
};

// POST /api/orders/:id/pay/verify — called by the browser after Razorpay Checkout succeeds
exports.verify = async (req, res) => {
  const { razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = matchedData(
    req,
    { locations: ['body'] }
  );
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.payment?.razorpayOrderId !== rzpOrderId) throw ApiError.badRequest('Payment does not match this order');
  if (!razorpay.verifyCheckoutSignature({ orderId: rzpOrderId, paymentId, signature })) {
    throw ApiError.badRequest('Payment signature could not be verified');
  }
  const updated = await confirmPayment(order, paymentId);
  res.json({ success: true, order: updated });
};

// POST /api/payments/razorpay/webhook — Razorpay server-to-server events (backup to the browser callback)
exports.webhook = async (req, res) => {
  if (!razorpay.verifyWebhookSignature(req.rawBody, req.get('x-razorpay-signature'))) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }
  const { event, payload } = req.body || {};
  const payment = payload?.payment?.entity;
  if (payment?.order_id) {
    const order = await Order.findOne({ 'payment.razorpayOrderId': payment.order_id });
    if (order) {
      if (event === 'payment.captured' || event === 'order.paid' || event === 'payment.authorized') {
        await confirmPayment(order, payment.id).catch((err) => console.error('Webhook confirm failed:', err.message));
      } else if (event === 'payment.failed') {
        await Order.updateOne(
          { _id: order._id, 'payment.status': 'unpaid' },
          { 'payment.failureReason': payment.error_description || 'Payment failed' }
        );
      }
    }
  }
  res.json({ success: true });
};

// GET /api/orders/mine
exports.mine = async (req, res) => {
  await releaseExpired();
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, orders });
};

// GET /api/orders/:id — owner or admin
exports.get = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
  if (!order) throw ApiError.notFound('Order not found');
  const isOwner = String(order.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw ApiError.notFound('Order not found');
  res.json({ success: true, order, paymentWindowMin });
};

// POST /api/orders/:id/cancel — owner, before the order is packed (paid orders are refunded)
exports.cancel = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order || !['awaiting_payment', 'pending'].includes(order.status)) {
    throw ApiError.badRequest('Only orders that have not been packed yet can be cancelled');
  }
  const cancelled = await cancelOrder(order, 'Cancelled by customer');
  res.json({ success: true, order: cancelled });
};

// GET /api/orders — admin
exports.list = async (_req, res) => {
  await releaseExpired();
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
  res.json({ success: true, orders });
};

// PATCH /api/orders/:id/status — admin
exports.updateStatus = async (req, res) => {
  const { status } = matchedData(req, { locations: ['body'] });
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status === 'cancelled') throw ApiError.badRequest('Cancelled orders cannot be changed');
  if (status === 'cancelled') {
    const cancelled = await cancelOrder(order, 'Cancelled by the store');
    return res.json({ success: true, order: cancelled });
  }
  if (order.status === 'awaiting_payment') throw ApiError.badRequest('This order has not been paid yet');

  const change = { status };
  // Cash on delivery is collected when the parcel is delivered
  if (status === 'delivered' && order.paymentMethod === 'cod' && order.payment?.status !== 'paid') {
    Object.assign(change, { 'payment.status': 'paid', 'payment.method': 'cash', 'payment.paidAt': new Date() });
  }
  const updated = await Order.findOneAndUpdate({ _id: order._id, status: order.status }, change, { new: true });
  if (!updated) throw ApiError.conflict('Order was changed by someone else; reload and retry');
  res.json({ success: true, order: updated });
};

exports.releaseExpired = releaseExpired;
