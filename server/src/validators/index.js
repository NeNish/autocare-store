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

const createOrder = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Cart is empty'),
  body('items.*.product').isMongoId().withMessage('Invalid product id'),
  body('items.*.quantity').isInt({ min: 1, max: 99 }).withMessage('Quantity must be 1-99').toInt(),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('shippingAddress.phone').trim().matches(/^[+\d][\d\s-]{7,15}$/).withMessage('Valid phone is required'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address is required').isLength({ max: 200 }),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required').isLength({ max: 80 }),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required').isLength({ max: 80 }),
  body('shippingAddress.postalCode').trim().matches(/^\d{6}$/).withMessage('PIN code must be 6 digits'),
];

const orderStatus = [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
];

module.exports = {
  mongoId,
  register,
  login,
  category,
  createProduct: productFields(false),
  updateProduct: productFields(true),
  listProducts,
  createOrder,
  orderStatus,
};
