const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Run after an array of express-validator chains
module.exports = function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    throw ApiError.badRequest('Validation failed', details);
  }
  next();
};
