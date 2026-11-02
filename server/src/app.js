const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { clientUrl, isProd } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: clientUrl.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
if (!isProd && process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
