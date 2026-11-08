const { body, param, query } = require('express-validator');

const mongoId = (field) => param(field).isMongoId().withMessage(`Invalid ${field}`);

const register = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number'),
];

const login = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const category = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('number').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
  body('description').optional().trim().isLength({ max: 1000 }),
];

const productFields = (optional) => {
  const o = (chain) => (optional ? chain.optional() : chain);
  return [
    o(body('name')).trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
    o(body('category')).isMongoId().withMessage('Valid category id is required'),
    o(body('price')).isFloat({ min: 0 }).withMessage('Price must be 0 or more').toFloat(),
    o(body('stock')).isInt({ min: 0 }).withMessage('Stock must be 0 or more').toInt(),
    body('description').optional().trim().isLength({ max: 3000 }),
    body('type').optional().trim().isLength({ max: 60 }),
    body('image')
      .optional()
      .trim()
      .custom((v) => v === '' || /^https?:\/\/\S+$/i.test(v))
      .withMessage('Image must be an http(s) URL'),
    body('features').optional().isArray({ max: 20 }),
    body('features.*').optional().isString().trim().isLength({ max: 200 }),
    body('isActive').optional().isBoolean().toBoolean(),
    body('bladeLengthsIn').optional().isArray({ max: 3 }).withMessage('Up to 3 blade lengths'),
    body('bladeLengthsIn.*').optional().isFloat({ min: 8, max: 40 }).withMessage('Blade lengths must be 8–40 inches').toFloat(),
    body('connectors').optional().isArray({ max: 8 }),
    body('connectors.*').optional().isString().trim().isLength({ min: 1, max: 40 }),
    body('kitItems').optional().isArray({ max: 10 }).withMessage('Up to 10 kit items'),
    body('kitItems.*.product').optional().isMongoId().withMessage('Invalid kit product'),
    body('kitItems.*.quantity').optional().isInt({ min: 1, max: 20 }).withMessage('Kit quantity must be 1–20').toInt(),
  ];
};

const listProducts = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('q').optional().trim().isLength({ max: 100 }),
  query('category').optional().trim().isLength({ max: 120 }),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'name']),
];

const cartItems = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Cart is empty'),
  body('items.*.product').isMongoId().withMessage('Invalid product id'),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99').toInt(),
  body('couponCode').optional({ values: 'falsy' }).trim().isLength({ max: 30 }).withMessage('Invalid code'),
];
const quote = cartItems;
const createOrder = [
  ...cartItems,
  body('reminderOptIn').optional().isBoolean().toBoolean(),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('shippingAddress.phone').trim().matches(/^[+\d][\d\s-]{7,15}$/).withMessage('Valid phone is required'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address is required').isLength({ max: 200 }),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required').isLength({ max: 80 }),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required').isLength({ max: 80 }),
  body('shippingAddress.postalCode').trim().matches(/^\d{6}$/).withMessage('PIN code must be 6 digits'),
];

const verifyPayment = [
  body('razorpay_order_id').isString().trim().isLength({ min: 4, max: 60 }),
  body('razorpay_payment_id').isString().trim().isLength({ min: 4, max: 60 }),
  body('razorpay_signature').isString().trim().isLength({ min: 10, max: 200 }),
];

const settings = [
  body('shippingFee').optional().isFloat({ min: 0, max: 10000 }).withMessage('Shipping fee must be 0–10000').toFloat(),
  body('freeShippingFrom').optional().isFloat({ min: 0, max: 1000000 }).withMessage('Free-shipping amount must be 0 or more').toFloat(),
  body('remindersEnabled').optional().isBoolean().toBoolean(),
  body('reminderMonths').optional().isInt({ min: 1, max: 24 }).withMessage('Reminder months must be 1–24').toInt(),
];

const optNum = (field, opts, msg) => body(field).optional({ values: 'null' }).isFloat(opts).withMessage(msg).toFloat();
const coupon = [
  body('code').trim().matches(/^[A-Za-z0-9_-]{3,30}$/).withMessage('Code must be 3–30 letters, numbers, - or _').toUpperCase(),
  body('description').optional().trim().isLength({ max: 200 }),
  body('kind').isIn(['percent', 'fixed']).withMessage('Type must be percent or fixed'),
  body('value')
    .isFloat({ min: 1 }).withMessage('Value must be at least 1').toFloat()
    .custom((v, { req }) => req.body.kind !== 'percent' || v <= 90).withMessage('Percent discounts can be at most 90%'),
  optNum('minSubtotal', { min: 0 }, 'Minimum order must be 0 or more'),
  optNum('maxDiscount', { min: 1 }, 'Maximum discount must be at least 1'),
  body('startsAt').optional({ values: 'null' }).isISO8601().withMessage('Invalid start date').toDate(),
  body('endsAt')
    .optional({ values: 'null' }).isISO8601().withMessage('Invalid end date').toDate()
    .custom((v, { req }) => !req.body.startsAt || new Date(v) > new Date(req.body.startsAt)).withMessage('End date must be after the start date'),
  body('usageLimit').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Usage limit must be at least 1').toInt(),
  body('oncePerCustomer').optional().isBoolean().toBoolean(),
  body('active').optional().isBoolean().toBoolean(),
];

const orderStatus = [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
];

const CONNECTORS = ['J-hook', 'U-hook', 'Pinch tab', 'Push button', 'Side pin', 'Bayonet', 'Other'];
const year = new Date().getFullYear() + 1;
const inches = (field, required) => {
  const c = body(field);
  return (required ? c : c.optional({ values: 'null' }))
    .isFloat({ min: 8, max: 40 })
    .withMessage(`${field} must be between 8 and 40 inches`)
    .toFloat();
};
const fitment = [
  body('make').trim().notEmpty().withMessage('Make is required').isLength({ max: 60 }),
  body('model').trim().notEmpty().withMessage('Model is required').isLength({ max: 80 }),
  body('variant').optional().trim().isLength({ max: 80 }),
  body('yearFrom').isInt({ min: 1950, max: year }).withMessage('Valid start year is required').toInt(),
  body('yearTo').optional({ values: 'null' }).isInt({ min: 1950, max: year }).withMessage('Valid end year').toInt(),
  inches('driverIn', true),
  inches('passengerIn', true),
  inches('rearIn', false),
  body('connector').isIn(CONNECTORS).withMessage(`Connector must be one of: ${CONNECTORS.join(', ')}`),
  body('source').trim().isLength({ min: 3, max: 300 }).withMessage('A verification source is required (e.g. owner’s manual page or OEM catalogue)'),
  body('notes').optional().trim().isLength({ max: 500 }),
];
const fitLookup = [
  query('make').trim().notEmpty().isLength({ max: 60 }),
  query('model').trim().notEmpty().isLength({ max: 80 }),
  query('year').isInt({ min: 1950, max: year }).toInt(),
];
const fitMatch = [
  query('driver').isFloat({ min: 8, max: 40 }).withMessage('Driver-side length must be 8–40 inches').toFloat(),
  query('passenger').isFloat({ min: 8, max: 40 }).withMessage('Passenger-side length must be 8–40 inches').toFloat(),
  query('connector').optional({ values: 'falsy' }).isIn(CONNECTORS),
];
const assistant = [
  body('messages').isArray({ min: 1, max: 16 }).withMessage('Messages are required'),
  body('messages.*.role').isIn(['user', 'assistant']),
  body('messages.*.content').isString().trim().isLength({ min: 1, max: 1200 }).withMessage('Each message must be 1–1200 characters'),
];

module.exports = {
  CONNECTORS,
  fitment,
  fitLookup,
  fitMatch,
  assistant,
  mongoId,
  register,
  login,
  category,
  createProduct: productFields(false),
  updateProduct: productFields(true),
  listProducts,
  createOrder,
  quote,
  verifyPayment,
  settings,
  coupon,
  orderStatus,
};
