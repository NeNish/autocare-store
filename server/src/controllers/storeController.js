// Store settings, coupons, blade reminders and the daily maintenance job
const { matchedData } = require('express-validator');
const Settings = require('../models/Settings');
const Coupon = require('../models/Coupon');
const Reminder = require('../models/Reminder');
const ApiError = require('../utils/ApiError');
const razorpay = require('../utils/razorpay');
const { sendReminderEmail, emailConfigured } = require('../utils/email');
const { cronSecret, clientUrl } = require('../config/env');
const { releaseExpired } = require('./orderController');

// ---- Settings ----
exports.publicSettings = async (_req, res) => {
  const s = await Settings.get();
  res.json({
    success: true,
    settings: {
      shippingFee: s.shippingFee,
      freeShippingFrom: s.freeShippingFrom,
      remindersEnabled: s.remindersEnabled,
      reminderMonths: s.reminderMonths,
      paymentsEnabled: razorpay.configured(),
      codEnabled: s.codEnabled,
      codFee: s.codFee,
      codMaxOrder: s.codMaxOrder,
    },
  });
};

exports.getSettings = async (_req, res) => {
  const settings = await Settings.get();
  res.json({
    success: true,
    settings,
    status: { paymentsEnabled: razorpay.configured(), webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET), emailEnabled: emailConfigured() },
  });
};

exports.updateSettings = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  await Settings.findOneAndUpdate({ key: 'store' }, data, { upsert: true, new: true, runValidators: true });
  const settings = await Settings.get();
  res.json({ success: true, settings });
};

// ---- Coupons ----
exports.listCoupons = async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, coupons });
};

exports.createCoupon = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  if (await Coupon.exists({ code: data.code.toUpperCase() })) throw ApiError.conflict('A coupon with this code already exists');
  const coupon = await Coupon.create(data);
  res.status(201).json({ success: true, coupon });
};

exports.updateCoupon = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  const clash = await Coupon.findOne({ code: data.code.toUpperCase(), _id: { $ne: req.params.id } }).lean();
  if (clash) throw ApiError.conflict('A coupon with this code already exists');
  const unset = {};
  for (const k of ['maxDiscount', 'startsAt', 'endsAt', 'usageLimit']) if (data[k] == null) unset[k] = 1;
  for (const k of Object.keys(unset)) delete data[k];
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: data, $unset: unset }, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  res.json({ success: true, coupon });
};

exports.removeCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  res.json({ success: true });
};

// ---- Reminders ----
exports.myReminders = async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).sort({ dueAt: 1 }).lean();
  res.json({ success: true, reminders });
};

exports.cancelMyReminder = async (req, res) => {
  const r = await Reminder.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: 'scheduled' },
    { status: 'cancelled' },
    { new: true }
  );
  if (!r) throw ApiError.notFound('Reminder not found');
  res.json({ success: true, reminder: r });
};

exports.listReminders = async (_req, res) => {
  const reminders = await Reminder.find().sort({ dueAt: 1 }).lean();
  res.json({ success: true, reminders, emailEnabled: emailConfigured() });
};

exports.markReminderSent = async (req, res) => {
  const r = await Reminder.findOneAndUpdate(
    { _id: req.params.id, status: 'scheduled' },
    { status: 'sent', sentAt: new Date() },
    { new: true }
  );
  if (!r) throw ApiError.notFound('Reminder not found or already handled');
  res.json({ success: true, reminder: r });
};

// ---- Daily job (Vercel Cron calls it with "Authorization: Bearer <CRON_SECRET>") ----
exports.daily = async (req, res) => {
  if (!cronSecret || req.get('authorization') !== `Bearer ${cronSecret}`) throw ApiError.unauthorized();
  const released = await releaseExpired();
  let sent = 0;
  let failed = 0;
  if (emailConfigured()) {
    const due = await Reminder.find({ status: 'scheduled', dueAt: { $lte: new Date() } }).limit(50).lean();
    for (const r of due) {
      try {
        await sendReminderEmail(r, `${clientUrl.split(',')[0].trim()}/fit`);
        await Reminder.updateOne({ _id: r._id, status: 'scheduled' }, { status: 'sent', sentAt: new Date() });
        sent += 1;
      } catch (err) {
        failed += 1;
        console.error('Reminder email failed:', err.message);
      }
    }
  }
  res.json({ success: true, releasedOrders: released, remindersSent: sent, remindersFailed: failed });
};

// POST /api/catalogue/sync — admin: same as `npm run seed` for products (no users touched)
exports.syncCatalogue = async (_req, res) => {
  const { syncCatalogue } = require('../seed/catalogue');
  const result = await syncCatalogue();
  res.json({ success: true, result });
};
