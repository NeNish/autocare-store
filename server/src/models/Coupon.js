const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    description: { type: String, trim: true, maxlength: 200 },
    kind: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 1 }, // percent (1-90) or INR
    minSubtotal: { type: Number, min: 0, default: 0 },
    maxDiscount: { type: Number, min: 0 }, // cap for percent coupons (INR); empty = no cap
    startsAt: { type: Date },
    endsAt: { type: Date },
    usageLimit: { type: Number, min: 1 }, // total redemptions; empty = unlimited
    oncePerCustomer: { type: Boolean, default: true },
    usedCount: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
