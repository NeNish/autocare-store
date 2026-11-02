const { matchedData } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

exports.list = async (_req, res) => {
  const categories = await Category.find().sort({ number: 1, name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({
    success: true,
    categories: categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) || 0 })),
  });
};

exports.getBySlug = async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug }).lean();
  if (!category) throw ApiError.notFound('Category not found');
  res.json({ success: true, category });
};

exports.create = async (req, res) => {
  const category = await Category.create(matchedData(req));
  res.status(201).json({ success: true, category });
};

exports.update = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  Object.assign(category, matchedData(req, { locations: ['body'] }));
  await category.save();
  res.json({ success: true, category });
};

exports.remove = async (req, res) => {
  const inUse = await Product.exists({ category: req.params.id });
  if (inUse) throw ApiError.conflict('Category still has products; move or delete them first');
  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Category not found');
  res.json({ success: true });
};
