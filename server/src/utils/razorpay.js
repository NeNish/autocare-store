// Minimal Razorpay client over its REST API (no SDK needed).
// Docs: https://razorpay.com/docs/api/orders/ and /payments/
const crypto = require('crypto');
const { razorpay } = require('../config/env');
const ApiError = require('./ApiError');

const configured = () => Boolean(razorpay.keyId && razorpay.keySecret);

async function call(method, path, body) {
  if (!configured()) throw new ApiError(503, 'Online payments are not set up yet. Please try again later.');
  const auth = Buffer.from(`${razorpay.keyId}:${razorpay.keySecret}`).toString('base64');
  let res;
  try {
    res = await fetch(`${razorpay.apiUrl}${path}`, {
      method,
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    console.error('Razorpay request failed:', err.message);
    throw new ApiError(502, 'Could not reach the payment provider. Please try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Razorpay error:', res.status, data?.error?.description || data);
    throw new ApiError(502, data?.error?.description || 'The payment provider returned an error');
  }
  return data;
}

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = {
  configured,
  keyId: () => razorpay.keyId,
  createOrder: ({ amountPaise, receipt, notes }) =>
    call('POST', '/orders', { amount: amountPaise, currency: 'INR', receipt, notes }),
  fetchPayment: (id) => call('GET', `/payments/${encodeURIComponent(id)}`),
  capturePayment: (id, amountPaise) =>
    call('POST', `/payments/${encodeURIComponent(id)}/capture`, { amount: amountPaise, currency: 'INR' }),
  refundPayment: (id, amountPaise) => call('POST', `/payments/${encodeURIComponent(id)}/refund`, { amount: amountPaise }),
  // Checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  verifyCheckoutSignature: ({ orderId, paymentId, signature }) => {
    if (!razorpay.keySecret || !signature) return false;
    const expected = crypto.createHmac('sha256', razorpay.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    return safeEqual(expected, signature);
  },
  // Webhook signature: HMAC_SHA256(raw body, webhook_secret)
  verifyWebhookSignature: (rawBody, signature) => {
    if (!razorpay.webhookSecret || !signature || !rawBody) return false;
    const expected = crypto.createHmac('sha256', razorpay.webhookSecret).update(rawBody).digest('hex');
    return safeEqual(expected, signature);
  },
};
