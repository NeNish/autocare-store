const mongoose = require('mongoose');

// One verified wiper fitment for a vehicle (make, model, year range).
// Every record must cite where it was verified, so the finder never
// recommends blades from guesswork.
const fitmentSchema = new mongoose.Schema(
  {
    make: { type: String, required: true, trim: true, maxlength: 60, index: true },
    model: { type: String, required: true, trim: true, maxlength: 80 },
    variant: { type: String, trim: true, maxlength: 80 },
    yearFrom: { type: Number, required: true, min: 1950 },
    yearTo: { type: Number, min: 1950 }, // empty = still in production
    driverIn: { type: Number, required: true, min: 8, max: 40 },
    passengerIn: { type: Number, required: true, min: 8, max: 40 },
    rearIn: { type: Number, min: 8, max: 40 },
    connector: { type: String, required: true, trim: true },
    source: { type: String, required: true, trim: true, maxlength: 300 },
    notes: { type: String, trim: true, maxlength: 500 },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

fitmentSchema.index({ make: 1, model: 1 });

module.exports = mongoose.model('Fitment', fitmentSchema);
