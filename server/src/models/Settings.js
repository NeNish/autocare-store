const mongoose = require('mongoose');

// Store-wide settings edited from the admin panel. A single document (key "store").
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'store', unique: true },
    shippingFee: { type: Number, min: 0, max: 10000, default: 79 }, // INR; 0 = always free
    freeShippingFrom: { type: Number, min: 0, max: 1000000, default: 999 }, // INR; 0 = no free-shipping threshold
    codEnabled: { type: Boolean, default: true },
    codFee: { type: Number, min: 0, max: 1000, default: 0 }, // INR added to cash-on-delivery orders
    codMaxOrder: { type: Number, min: 0, max: 1000000, default: 0 }, // INR; 0 = no limit
    remindersEnabled: { type: Boolean, default: true },
    reminderMonths: { type: Number, min: 1, max: 24, default: 6 },
  },
  { timestamps: true }
);

// Returns the settings as a plain object. Not lean, so defaults fill in any fields added
// after the record was first created (e.g. cash-on-delivery options).
settingsSchema.statics.get = async function get() {
  const doc = await this.findOneAndUpdate({ key: 'store' }, { $setOnInsert: { key: 'store' } }, { upsert: true, new: true });
  return doc.toObject();
};

module.exports = mongoose.model('Settings', settingsSchema);
