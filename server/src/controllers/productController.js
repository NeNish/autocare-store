const mongoose = require('mongoose');
const { matchedData } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products?q=&category=<slug|id>&minPrice=&maxPrice=&sort=&page=&limit=
exports.list = async (req, res) => {
  const { q, category, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12 } = matchedData(req, {
    locations: ['query'],
  });
  const includeInactive = req.user?.role === 'admin' && req.query.all === 'true';

  const filter = includeInactive ? {} : { isActive: true };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { description: rx }, { type: rx }];
  }
  if (category) {
    const cat = mongoose.isValidObjectId(category)
      ? await Category.findById(category).lean()
      : await Category.findOne({ slug: category }).lean();
    if (!cat) return res.json({ success: true, products: [], total: 0, page, pages: 0 });
    filter.category = cat._id;
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug number')
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
};

// GET /api/products/:idOrSlug
exports.get = async (req, res) => {
  const key = req.params.idOrSlug;
  const filter = mongoose.isValidObjectId(key) ? { _id: key } : { slug: key };
  const product = await Product.findOne(filter)
    .populate('category', 'name slug number')
    .populate('kitItems.product', 'name slug price type isActive image')
    .lean();
  if (!product || (!product.isActive && req.user?.role !== 'admin')) throw ApiError.notFound('Product not found');
  if (product.kitItems?.length) {
    // What the contents cost bought separately today, so the saving shown is always current
    product.kitItems = product.kitItems.filter((k) => k.product);
    product.kitValue = product.kitItems.reduce((sum, k) => sum + k.product.price * k.quantity, 0);
  }
  res.json({ success: true, product });
};

// Kit contents must be existing products that are not kits themselves
async function checkKit(kitItems, selfId) {
  if (!kitItems?.length) return;
  const ids = kitItems.map((k) => k.product);
  if (selfId && ids.includes(String(selfId))) throw ApiError.badRequest('A kit cannot contain itself');
  const found = await Product.find({ _id: { $in: ids } }).select('type').lean();
  if (found.length !== new Set(ids).size) throw ApiError.badRequest('A kit item no longer exists');
  if (found.some((p) => p.type === 'Kit')) throw ApiError.badRequest('A kit cannot contain another kit');
}

exports.create = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  if (!(await Category.exists({ _id: data.category }))) throw ApiError.badRequest('Category does not exist');
  await checkKit(data.kitItems);
  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
};

exports.update = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  if (data.category && !(await Category.exists({ _id: data.category }))) {
    throw ApiError.badRequest('Category does not exist');
  }
  await checkKit(data.kitItems, req.params.id);
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  Object.assign(product, data);
  await product.save();
  res.json({ success: true, product });
};

exports.remove = async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Product not found');
  res.json({ success: true });
};
