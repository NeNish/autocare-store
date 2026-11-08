const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      line1: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    coupon: { code: String, kind: String, value: Number },
    shipping: { type: Number, required: true },
    codFee: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
    total: { type: Number, required: true },
    // awaiting_payment: stock is held while the customer pays (released after PAYMENT_WINDOW_MIN)
    // pending: paid, waiting to be packed
    status: {
      type: String,
      enum: ['awaiting_payment', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'awaiting_payment',
      index: true,
    },
    payment: {
      provider: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
      status: { type: String, enum: ['unpaid', 'paid', 'failed', 'refunded'], default: 'unpaid' },
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: { type: String },
      method: { type: String },
      paidAt: { type: Date },
      refundId: { type: String },
      failureReason: { type: String },
    },
    reminderOptIn: { type: Boolean, default: false },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
