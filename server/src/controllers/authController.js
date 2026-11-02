const jwt = require('jsonwebtoken');
const { matchedData } = require('express-validator');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { jwtSecret, jwtExpiresIn, isProd } = require('../config/env');
const { COOKIE_NAME } = require('../middleware/auth');

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function sendSession(res, user, status = 200) {
  const token = jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
  res.status(status).json({ success: true, user });
}

exports.register = async (req, res) => {
  const { name, email, password } = matchedData(req);
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  const user = await User.create({ name, email, password }); // role always defaults to customer
  sendSession(res, user, 201);
};

exports.login = async (req, res) => {
  const { email, password } = matchedData(req);
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  sendSession(res, user);
};

exports.logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: isProd, sameSite: 'lax' });
  res.json({ success: true });
};

exports.me = (req, res) => {
  res.json({ success: true, user: req.user || null });
};
