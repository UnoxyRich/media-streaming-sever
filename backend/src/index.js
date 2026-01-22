require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const { buildRateLimit } = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const mediaRoutes = require('./routes/media');
const statsRoutes = require('./routes/stats');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', buildRateLimit({ max: 10 }), authRoutes);
app.use('/api/users', buildRateLimit({ max: 20 }), userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stats', buildRateLimit({ max: 20 }), statsRoutes);

app.use((err, req, res, next) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: 'Unexpected error' });
    return;
  }
  next();
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on ${port}`);
});
