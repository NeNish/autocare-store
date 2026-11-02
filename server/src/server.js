// Local development entry: `npm run dev` / `npm start`
const { port, missingEnv } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

if (process.env.VERCEL) {
  // On Vercel the app handles env checks and DB connection per request; just listen.
  app.listen(port);
} else {
  if (missingEnv.length) {
    console.error(
      `Missing environment variable(s): ${missingEnv.join(', ')}. Copy .env.example to .env and fill them in.`,
    );
    process.exit(1);
  }
  start();
}

function start() {
  connectDB()
    .then(() => {
      const server = app.listen(port, () => console.log(`API listening on http://localhost:${port}/api`));
      const shutdown = (signal) => {
        console.log(`${signal} received, shutting down`);
        server.close(() => process.exit(0));
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    })
    .catch((err) => {
      console.error('Failed to start server:', err.message);
      process.exit(1);
    });
}
