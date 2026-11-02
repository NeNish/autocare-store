const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { jwtSecret } = require('../config/env');

const COOKIE_NAME = 'token';

function getToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

// Requires a valid session; attaches req.user
async function protect(req, _res, next) {
  const token = getToken(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch {
    throw ApiError.unauthorized('Session expired or invalid');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  req.user = user;
  next();
}

// Attaches req.user if a valid session exists, but never rejects
async function optionalAuth(req, _res, next) {
  const token = getToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, jwtSecret);
      req.user = (await User.findById(payload.sub)) || undefined;
    } catch {
      /* ignore invalid token on public routes */
    }
  }
  next();
}

// Restricts a route to the given roles; use after protect
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
}

module.exports = { protect, optionalAuth, authorize, COOKIE_NAME };
