const mongoose = require('mongoose');
const { mongoUri } = require('./env');

// Reuse one connection across requests. On Vercel each warm serverless instance
// keeps this module in memory, so we only connect on a cold start.
let connecting = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    mongoose.set('strictQuery', true);
    connecting = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m.connection;
      })
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  return connecting;
}

module.exports = connectDB;
