const { matchedData } = require('express-validator');
const Fitment = require('../models/Fitment');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { matchBlades } = require('../utils/bladeMatch');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactCI = (s) => new RegExp(`^${escapeRegex(s)}$`, 'i');

const PRODUCT_FIELDS = 'name slug price stock type bladeLengthsIn connectors features image';

async function bladeProducts() {
  return Product.find({ isActive: true, 'bladeLengthsIn.1': { $exists: true } }).select(PRODUCT_FIELDS).lean();
}

const uniqSorted = (arr) => [...new Set(arr.filter(Boolean))].sort((a, b) => a.localeCompare(b));

// GET /api/fitments/makes
exports.makes = async (_req, res) => {
  const rows = await Fitment.find().select('make').lean();
  res.json({ success: true, makes: uniqSorted(rows.map((r) => r.make)) });
};

// GET /api/fitments/models?make=
exports.models = async (req, res) => {
  const make = String(req.query.make || '').trim();
  if (!make) throw ApiError.badRequest('make is required');
  const rows = await Fitment.find({ make: exactCI(make) }).select('model').lean();
  res.json({ success: true, models: uniqSorted(rows.map((r) => r.model)) });
};

// GET /api/fitments/years?make=&model=
exports.years = async (req, res) => {
  const make = String(req.query.make || '').trim();
  const model = String(req.query.model || '').trim();
  if (!make || !model) throw ApiError.badRequest('make and model are required');
  const rows = await Fitment.find({ make: exactCI(make), model: exactCI(model) }).select('yearFrom yearTo').lean();
  const now = new Date().getFullYear();
  const years = new Set();
  for (const r of rows) for (let y = r.yearFrom; y <= (r.yearTo || now); y++) years.add(y);
  res.json({ success: true, years: [...years].sort((a, b) => b - a) });
};

// GET /api/fitments/lookup?make=&model=&year=
exports.lookup = async (req, res) => {
  const { make, model, year } = matchedData(req, { locations: ['query'] });
  const records = await Fitment.find({
    make: exactCI(make),
    model: exactCI(model),
    yearFrom: { $lte: year },
    $or: [{ yearTo: { $gte: year } }, { yearTo: null }, { yearTo: { $exists: false } }],
  })
    .select('-verifiedBy -__v')
    .lean();
  const products = await bladeProducts();
  const results = records.map((f) => ({
    fitment: f,
    ...matchBlades(products, { driver: f.driverIn, passenger: f.passengerIn, connector: f.connector }),
  }));
  res.json({ success: true, results });
};

// GET /api/fitments/match?driver=&passenger=&connector=
exports.match = async (req, res) => {
  const { driver, passenger, connector } = matchedData(req, { locations: ['query'] });
  const products = await bladeProducts();
  res.json({ success: true, requested: { driver, passenger, connector: connector || null }, ...matchBlades(products, { driver, passenger, connector }) });
};

// Admin CRUD
exports.list = async (_req, res) => {
  const fitments = await Fitment.find().sort({ make: 1, model: 1, yearFrom: -1 }).populate('verifiedBy', 'name').lean();
  res.json({ success: true, fitments });
};

exports.create = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  if (data.yearTo && data.yearTo < data.yearFrom) throw ApiError.badRequest('End year must be after start year');
  const fitment = await Fitment.create({ ...data, verifiedBy: req.user._id });
  res.status(201).json({ success: true, fitment });
};

exports.update = async (req, res) => {
  const data = matchedData(req, { locations: ['body'] });
  if (data.yearTo && data.yearTo < data.yearFrom) throw ApiError.badRequest('End year must be after start year');
  const fitment = await Fitment.findById(req.params.id);
  if (!fitment) throw ApiError.notFound('Fitment not found');
  Object.assign(fitment, data, { verifiedBy: req.user._id });
  if (data.yearTo === null || data.yearTo === undefined) fitment.yearTo = undefined;
  if (data.rearIn === null || data.rearIn === undefined) fitment.rearIn = undefined;
  await fitment.save();
  res.json({ success: true, fitment });
};

exports.remove = async (req, res) => {
  const deleted = await Fitment.findByIdAndDelete(req.params.id);
  if (!deleted) throw ApiError.notFound('Fitment not found');
  res.json({ success: true });
};
