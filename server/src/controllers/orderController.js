const { matchedData } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

const FREE_SHIPPING_FROM = 999; // INR
const SHIPPING_FEE = 79; // INR

async function restock(items) {
  await Promise.all(
    items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
  );
}

// POST /api/orders — prices always come from the database, never the client
exports.create = async (req, res) => {
  const { items, shippingAddress } = matchedData(req, { locations: ['body'] });

  // Merge duplicate lines for the same product
  const merged = new Map();
  for (const { product, quantity } of items) {
    merged.set(product, (merged.get(product) || 0) + quantity);
  }

  // Reserve stock atomically per item; roll back if any item fails
  const reserved = [];
  try {
    for (const [productId, quantity] of merged) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isActive: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      ).lean();
      if (!product) {
        const exists = await Product.findById(productId).select('name stock isActive').lean();
        if (!exists || !exists.isActive) throw ApiError.badRequest('A product in your cart is no longer available');
        throw ApiError.badRequest(`Only ${exists.stock} left of "${exists.name}"`);
      }
      reserved.push({ product: product._id, name: product.name, price: product.price, quantity });
    }
  } catch (err) {
    await restock(reserved);
    throw err;
  }

  const subtotal = reserved.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;

  try {
    const order = await Order.create({
      user: req.user._id,
      items: reserved,
      shippingAddress,
      subtotal,
      shipping,
      total: subtotal + shipping,
    });
    res.status(201).json({ success: true, order });
  } catch (err) {
    await restock(reserved);
    throw err;
  }
};

// GET /api/orders/mine
exports.mine = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, orders });
};

// GET /api/orders/:id — owner or admin
exports.get = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
  if (!order) throw ApiError.notFound('Order not found');
  const isOwner = String(order.user._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw ApiError.notFound('Order not found');
  res.json({ success: true, order });
};

// POST /api/orders/:id/cancel — owner, only while pending
exports.cancel = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: 'pending' },
    { status: 'cancelled' },
    { new: true }
  );
  if (!order) throw ApiError.badRequest('Only your pending orders can be cancelled');
  await restock(order.items);
  res.json({ success: true, order });
};

// GET /api/orders — admin
exports.list = async (_req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
  res.json({ success: true, orders });
};

// PATCH /api/orders/:id/status — admin
exports.updateStatus = async (req, res) => {
  const { status } = matchedData(req, { locations: ['body'] });
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status === 'cancelled') throw ApiError.badRequest('Cancelled orders cannot be changed');

  // Atomic transition guards against double restocking
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { status },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('Order was changed by someone else; reload and retry');
  if (status === 'cancelled') await restock(updated.items);
  res.json({ success: true, order: updated });
};
