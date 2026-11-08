// Express app. Exported for Vercel (zero-config Express detects src/app.js);
// src/server.js runs it with app.listen() for local development.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { clientUrl, isProd, missingEnv } = require('./config/env');
const connectDB = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: clientUrl.split(',').map((s) => s.trim()), credentials: true }));
// Keep the raw body for webhook signature checks (Razorpay signs the exact bytes)
app.use(
  express.json({
    limit: '100kb',
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith('/api/payments/')) req.rawBody = buf;
    },
  })
);
app.use(cookieParser());
if (!isProd && process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ success: true, name: 'AutoCare Store API', health: '/api/health', docs: 'See README.md' });
});

// Report configuration problems clearly instead of crashing
app.use((_req, res, next) => {
  if (missingEnv.length) {
    return res.status(500).json({
      success: false,
      message: `Server misconfigured: missing environment variable(s) ${missingEnv.join(', ')}`,
    });
  }
  next();
});

// Ensure a database connection (cached across requests on warm instances)
app.use(async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
