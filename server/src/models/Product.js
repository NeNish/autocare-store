const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 3000 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    type: { type: String, trim: true, maxlength: 60 }, // e.g. "Wiper Blades", "Washer Fluid"
    price: { type: Number, required: true, min: 0 }, // in INR (rupees)
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, trim: true },
    features: [{ type: String, trim: true, maxlength: 200 }],
    // Wiper blades only: lengths in inches (a pair has two) and the arm connectors they fit.
    // These drive the vehicle compatibility finder, so enter them from the product's packaging.
    bladeLengthsIn: [{ type: Number, min: 8, max: 40 }],
    connectors: [{ type: String, trim: true, maxlength: 40 }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text' });

productSchema.pre('validate', function setSlug() {
  if (this.isModified('name') || !this.slug) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Product', productSchema);
