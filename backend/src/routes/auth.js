const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200)
});

function buildCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  };
}

router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const { username, password } = result.data;

  const [rows] = await pool.execute(
    'SELECT id, username, password_hash, role, is_active FROM users WHERE username = :username LIMIT 1',
    { username }
  );

  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const payload = { id: user.id, role: user.role, username: user.username };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });

  res.cookie(process.env.COOKIE_NAME, token, buildCookieOptions());
  return res.json({ id: user.id, username: user.username, role: user.role });
});

router.post('/logout', requireAuth, (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME, buildCookieOptions());
  res.json({ status: 'ok' });
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, username, role, is_active FROM users WHERE id = :id LIMIT 1',
    { id: req.user.id }
  );
  const user = rows[0];
  if (!user || !user.is_active) {
    return res.status(401).json({ message: 'Invalid session' });
  }
  return res.json({ id: user.id, username: user.username, role: user.role });
});

module.exports = router;
