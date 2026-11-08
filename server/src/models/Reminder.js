const mongoose = require('mongoose');

// Opt-in blade replacement reminders, created when a paid order containing wiper blades
// was placed with "remind me" ticked.
const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    name: { type: String },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    products: [{ type: String }],
    dueAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ['scheduled', 'sent', 'cancelled'], default: 'scheduled', index: true },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
