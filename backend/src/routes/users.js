const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

const createSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(8).max(200),
  role: z.enum(['admin', 'user'])
});

router.get('/', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, username, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const result = createSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const { username, password, role } = result.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [response] = await pool.execute(
      'INSERT INTO users (username, password_hash, role, is_active) VALUES (:username, :password_hash, :role, 1)',
      { username, password_hash: passwordHash, role }
    );
    res.status(201).json({ id: response.insertId, username, role, is_active: 1 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username already exists' });
    }
    throw error;
  }
});

router.patch('/:id', async (req, res) => {
  const schema = z.object({
    is_active: z.boolean().optional(),
    role: z.enum(['admin', 'user']).optional(),
    password: z.string().min(8).max(200).optional()
  });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const { is_active, role, password } = result.data;
  const updates = [];
  const params = { id: req.params.id };

  if (typeof is_active === 'boolean') {
    updates.push('is_active = :is_active');
    params.is_active = is_active ? 1 : 0;
  }
  if (role) {
    updates.push('role = :role');
    params.role = role;
  }
  if (password) {
    const passwordHash = await bcrypt.hash(password, 12);
    updates.push('password_hash = :password_hash');
    params.password_hash = passwordHash;
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No updates provided' });
  }

  await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = :id`, params);
  res.json({ status: 'ok' });
});

module.exports = router;
