'use client';

// Loads Razorpay Checkout on demand and opens it for a server-created order.
// Resolves with { razorpay_order_id, razorpay_payment_id, razorpay_signature } on success;
// rejects with { dismissed: true } if the customer closes it, or { message } on failure.
const SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loader = null;

function loadScript() {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve();
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loader = null;
        reject({ message: 'Could not load the payment window. Check your connection and try again.' });
      };
      document.body.appendChild(s);
    });
  }
  return loader;
}

export async function openCheckout(checkout) {
  await loadScript();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: checkout.keyId,
      order_id: checkout.razorpayOrderId,
      amount: checkout.amount,
      currency: checkout.currency,
      name: checkout.name,
      description: checkout.description,
      prefill: checkout.prefill,
      theme: { color: '#2f8cff' },
      // UPI first, then every other method enabled on the Razorpay account
      // (cards, net banking, wallets, EMI, cardless EMI, Pay Later)
      config: {
        display: {
          blocks: { upi: { name: 'Pay using UPI', instruments: [{ method: 'upi' }] } },
          sequence: ['block.upi'],
          preferences: { show_default_blocks: true },
        },
      },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject({ dismissed: true }), confirm_close: true },
    });
    rzp.on('payment.failed', (resp) => {
      // Razorpay keeps the window open so the customer can retry; we only record the reason
      console.warn('Payment attempt failed:', resp?.error?.description);
    });
    rzp.open();
  });
}
