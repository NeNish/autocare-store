require('dotenv').config({ quiet: true });

// Missing variables are reported, not thrown, so a misconfigured deployment
// returns a readable JSON error instead of crashing the serverless function.
const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !process.env[key]);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  missingEnv: missing,
  storeName: process.env.STORE_NAME || 'AutoCare',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    apiUrl: (process.env.RAZORPAY_API_URL || 'https://api.razorpay.com/v1').replace(/\/$/, ''),
  },
  // Minutes an unpaid order keeps its stock before it is released
  paymentWindowMin: Number(process.env.PAYMENT_WINDOW_MIN) || 30,
  cronSecret: process.env.CRON_SECRET || '',
  email: {
    resendKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || '',
  },
};
