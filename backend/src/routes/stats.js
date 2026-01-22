const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { pool } = require('../db');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res) => {
  const [[userCount]] = await pool.execute('SELECT COUNT(*) as count FROM users');
  const [[mediaCount]] = await pool.execute('SELECT COUNT(*) as count FROM media');
  const [[streamCount]] = await pool.execute('SELECT COUNT(*) as count FROM streams');
  const [[activeUsers]] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
  res.json({
    users: userCount.count,
    active_users: activeUsers.count,
    media: mediaCount.count,
    streams: streamCount.count
  });
});

module.exports = router;
