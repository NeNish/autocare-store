const express = require('express');
const rateLimit = require('express-rate-limit');
const v = require('../validators');
const validate = require('../middleware/validate');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const categories = require('../controllers/categoryController');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');

const router = express.Router();
const adminOnly = [protect, authorize('admin')];

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));

// Auth
router.post('/auth/register', authLimiter, v.register, validate, auth.register);
router.post('/auth/login', authLimiter, v.login, validate, auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', optionalAuth, auth.me);

// Categories
router.get('/categories', categories.list);
router.get('/categories/:slug', categories.getBySlug);
router.post('/categories', adminOnly, v.category, validate, categories.create);
router.put('/categories/:id', adminOnly, v.mongoId('id'), v.category, validate, categories.update);
router.delete('/categories/:id', adminOnly, v.mongoId('id'), validate, categories.remove);

// Products
router.get('/products', optionalAuth, v.listProducts, validate, products.list);
router.get('/products/:idOrSlug', optionalAuth, products.get);
router.post('/products', adminOnly, v.createProduct, validate, products.create);
router.put('/products/:id', adminOnly, v.mongoId('id'), v.updateProduct, validate, products.update);
router.delete('/products/:id', adminOnly, v.mongoId('id'), validate, products.remove);

// Orders
router.post('/orders', protect, v.createOrder, validate, orders.create);
router.get('/orders/mine', protect, orders.mine);
router.get('/orders', adminOnly, orders.list);
router.get('/orders/:id', protect, v.mongoId('id'), validate, orders.get);
router.post('/orders/:id/cancel', protect, v.mongoId('id'), validate, orders.cancel);
router.patch('/orders/:id/status', adminOnly, v.mongoId('id'), v.orderStatus, validate, orders.updateStatus);

module.exports = router;
