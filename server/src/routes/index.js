const express = require('express');
const rateLimit = require('express-rate-limit');
const v = require('../validators');
const validate = require('../middleware/validate');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const categories = require('../controllers/categoryController');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');
const fitments = require('../controllers/fitmentController');
const assistant = require('../controllers/assistantController');
const store = require('../controllers/storeController');

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

// Orders and payments
router.post('/orders/quote', optionalAuth, v.quote, validate, orders.quote);
router.post('/orders', protect, v.createOrder, validate, orders.create);
router.post('/orders/:id/pay', protect, v.mongoId('id'), validate, orders.pay);
router.post('/orders/:id/pay/verify', protect, v.mongoId('id'), v.verifyPayment, validate, orders.verify);
router.post('/payments/razorpay/webhook', orders.webhook);
router.get('/orders/mine', protect, orders.mine);
router.get('/orders', adminOnly, orders.list);
router.get('/orders/:id', protect, v.mongoId('id'), validate, orders.get);
router.post('/orders/:id/cancel', protect, v.mongoId('id'), validate, orders.cancel);
router.patch('/orders/:id/status', adminOnly, v.mongoId('id'), v.orderStatus, validate, orders.updateStatus);

// Store settings, coupons, reminders
router.get('/settings/public', store.publicSettings);
router.get('/settings', adminOnly, store.getSettings);
router.put('/settings', adminOnly, v.settings, validate, store.updateSettings);
router.get('/coupons', adminOnly, store.listCoupons);
router.post('/coupons', adminOnly, v.coupon, validate, store.createCoupon);
router.put('/coupons/:id', adminOnly, v.mongoId('id'), v.coupon, validate, store.updateCoupon);
router.delete('/coupons/:id', adminOnly, v.mongoId('id'), validate, store.removeCoupon);
router.get('/reminders/mine', protect, store.myReminders);
router.post('/reminders/:id/cancel', protect, v.mongoId('id'), validate, store.cancelMyReminder);
router.get('/reminders', adminOnly, store.listReminders);
router.post('/reminders/:id/sent', adminOnly, v.mongoId('id'), validate, store.markReminderSent);
router.get('/cron/daily', store.daily);

// Vehicle compatibility (public lookups; admin-managed verified records)
router.get('/fitments/makes', fitments.makes);
router.get('/fitments/models', fitments.models);
router.get('/fitments/years', fitments.years);
router.get('/fitments/lookup', v.fitLookup, validate, fitments.lookup);
router.get('/fitments/match', v.fitMatch, validate, fitments.match);
router.get('/fitments', adminOnly, fitments.list);
router.post('/fitments', adminOnly, v.fitment, validate, fitments.create);
router.put('/fitments/:id', adminOnly, v.mongoId('id'), v.fitment, validate, fitments.update);
router.delete('/fitments/:id', adminOnly, v.mongoId('id'), validate, fitments.remove);

// Windshield care assistant (rate limited: each AI answer has a cost)
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'You are sending messages quickly. Please wait a moment.' },
});
router.post('/assistant', assistantLimiter, v.assistant, validate, assistant.chat);

module.exports = router;
