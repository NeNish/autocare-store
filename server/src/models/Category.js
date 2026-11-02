const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema(
  {
    number: { type: Number, min: 1 },
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function setSlug() {
  if (this.isModified('name') || !this.slug) this.slug = slugify(this.name);
});

module.exports = mongoose.model('Category', categorySchema);
