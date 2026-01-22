const rateLimit = require('express-rate-limit');

function buildRateLimit(options = {}) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 900000);
  const max = Number(process.env.RATE_LIMIT_MAX || 50);

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
}

module.exports = { buildRateLimit };
