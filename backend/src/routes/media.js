const express = require('express');
const { z } = require('zod');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { buildRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const mediaSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(['movie', 'anime', 'tv']),
  type: z.enum(['movie', 'show', 'season', 'episode']),
  parent_id: z.number().int().nullable().optional(),
  year: z.number().int().min(1900).max(3000).optional().nullable(),
  sort_index: z.number().int().optional().nullable()
});

const streamSchema = z.object({
  source_url: z.string().url(),
  format: z.enum(['hls', 'dash', 'mp4']),
  quality_label: z.string().max(50).optional().nullable(),
  resolution: z.string().max(50).optional().nullable(),
  language: z.string().max(20).optional().nullable()
});

const subtitleSchema = z.object({
  source_url: z.string().url(),
  format: z.enum(['vtt', 'srt', 'ass']),
  label: z.string().max(100),
  language: z.string().max(20).optional().nullable(),
  is_default: z.boolean().optional()
});

router.get('/', requireAuth, async (req, res) => {
  const schema = z.object({
    category: z.enum(['movie', 'anime', 'tv']).optional(),
    type: z.enum(['movie', 'show', 'season', 'episode']).optional(),
    parent_id: z.string().optional()
  });
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid query' });
  }
  const { category, type, parent_id } = result.data;
  const conditions = [];
  const params = {};
  if (category) {
    conditions.push('category = :category');
    params.category = category;
  }
  if (type) {
    conditions.push('type = :type');
    params.type = type;
  }
  if (parent_id) {
    conditions.push('parent_id = :parent_id');
    params.parent_id = Number(parent_id);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT id, title, description, category, type, parent_id, year, sort_index, created_at FROM media ${where} ORDER BY sort_index ASC, title ASC`,
    params
  );
  res.json(rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, title, description, category, type, parent_id, year, sort_index, created_at FROM media WHERE id = :id',
    { id: req.params.id }
  );
  const media = rows[0];
  if (!media) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.json(media);
});

router.get('/:id/streams', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, media_id, source_url, format, quality_label, resolution, language FROM streams WHERE media_id = :media_id ORDER BY id ASC',
    { media_id: req.params.id }
  );
  res.json(rows);
});

router.get('/:id/subtitles', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT id, media_id, source_url, format, label, language, is_default FROM subtitles WHERE media_id = :media_id ORDER BY id ASC',
    { media_id: req.params.id }
  );
  res.json(rows);
});

router.get('/me/watch-history', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT wh.media_id, wh.position_seconds, wh.updated_at, m.title, m.category, m.type
     FROM watch_history wh
     JOIN media m ON m.id = wh.media_id
     WHERE wh.user_id = :user_id
     ORDER BY wh.updated_at DESC`,
    { user_id: req.user.id }
  );
  res.json(rows);
});

router.put('/:id/watch-history', requireAuth, async (req, res) => {
  const schema = z.object({ position_seconds: z.number().min(0) });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const { position_seconds } = result.data;
  await pool.execute(
    `INSERT INTO watch_history (user_id, media_id, position_seconds)
     VALUES (:user_id, :media_id, :position_seconds)
     ON DUPLICATE KEY UPDATE position_seconds = VALUES(position_seconds), updated_at = CURRENT_TIMESTAMP`,
    { user_id: req.user.id, media_id: req.params.id, position_seconds }
  );
  res.json({ status: 'ok' });
});

router.get('/me/watch-later', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT wl.media_id, wl.created_at, m.title, m.category, m.type
     FROM watch_later wl
     JOIN media m ON m.id = wl.media_id
     WHERE wl.user_id = :user_id
     ORDER BY wl.created_at DESC`,
    { user_id: req.user.id }
  );
  res.json(rows);
});

router.post('/:id/watch-later', requireAuth, async (req, res) => {
  await pool.execute(
    'INSERT IGNORE INTO watch_later (user_id, media_id) VALUES (:user_id, :media_id)',
    { user_id: req.user.id, media_id: req.params.id }
  );
  res.status(201).json({ status: 'ok' });
});

router.delete('/:id/watch-later', requireAuth, async (req, res) => {
  await pool.execute(
    'DELETE FROM watch_later WHERE user_id = :user_id AND media_id = :media_id',
    { user_id: req.user.id, media_id: req.params.id }
  );
  res.json({ status: 'ok' });
});

const adminLimiter = buildRateLimit({ max: 30 });

router.post('/', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  const result = mediaSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const data = result.data;
  const [response] = await pool.execute(
    `INSERT INTO media (title, description, category, type, parent_id, year, sort_index)
     VALUES (:title, :description, :category, :type, :parent_id, :year, :sort_index)`,
    {
      title: data.title,
      description: data.description || null,
      category: data.category,
      type: data.type,
      parent_id: data.parent_id ?? null,
      year: data.year ?? null,
      sort_index: data.sort_index ?? null
    }
  );
  res.status(201).json({ id: response.insertId, ...data });
});

router.patch('/:id', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  const result = mediaSchema.partial().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const fields = [];
  const params = { id: req.params.id };
  Object.entries(result.data).forEach(([key, value]) => {
    fields.push(`${key} = :${key}`);
    params[key] = value === undefined ? null : value;
  });
  if (!fields.length) {
    return res.status(400).json({ message: 'No updates provided' });
  }
  await pool.execute(`UPDATE media SET ${fields.join(', ')} WHERE id = :id`, params);
  res.json({ status: 'ok' });
});

router.delete('/:id', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  await pool.execute('DELETE FROM media WHERE id = :id', { id: req.params.id });
  res.json({ status: 'ok' });
});

router.post('/:id/streams', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  const result = streamSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const data = result.data;
  const [response] = await pool.execute(
    `INSERT INTO streams (media_id, source_url, format, quality_label, resolution, language)
     VALUES (:media_id, :source_url, :format, :quality_label, :resolution, :language)`,
    {
      media_id: req.params.id,
      source_url: data.source_url,
      format: data.format,
      quality_label: data.quality_label ?? null,
      resolution: data.resolution ?? null,
      language: data.language ?? null
    }
  );
  res.status(201).json({ id: response.insertId, ...data });
});

router.patch('/streams/:streamId', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  const result = streamSchema.partial().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const fields = [];
  const params = { id: req.params.streamId };
  Object.entries(result.data).forEach(([key, value]) => {
    fields.push(`${key} = :${key}`);
    params[key] = value === undefined ? null : value;
  });
  if (!fields.length) {
    return res.status(400).json({ message: 'No updates provided' });
  }
  await pool.execute(`UPDATE streams SET ${fields.join(', ')} WHERE id = :id`, params);
  res.json({ status: 'ok' });
});

router.delete('/streams/:streamId', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  await pool.execute('DELETE FROM streams WHERE id = :id', { id: req.params.streamId });
  res.json({ status: 'ok' });
});

router.post('/:id/subtitles', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  const result = subtitleSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const data = result.data;
  const [response] = await pool.execute(
    `INSERT INTO subtitles (media_id, source_url, format, label, language, is_default)
     VALUES (:media_id, :source_url, :format, :label, :language, :is_default)`,
    {
      media_id: req.params.id,
      source_url: data.source_url,
      format: data.format,
      label: data.label,
      language: data.language ?? null,
      is_default: data.is_default ? 1 : 0
    }
  );
  res.status(201).json({ id: response.insertId, ...data });
});

router.patch('/subtitles/:subtitleId', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  const result = subtitleSchema.partial().safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const fields = [];
  const params = { id: req.params.subtitleId };
  Object.entries(result.data).forEach(([key, value]) => {
    fields.push(`${key} = :${key}`);
    if (key === 'is_default') {
      params[key] = value ? 1 : 0;
    } else {
      params[key] = value === undefined ? null : value;
    }
  });
  if (!fields.length) {
    return res.status(400).json({ message: 'No updates provided' });
  }
  await pool.execute(`UPDATE subtitles SET ${fields.join(', ')} WHERE id = :id`, params);
  res.json({ status: 'ok' });
});

router.delete('/subtitles/:subtitleId', requireAuth, requireRole('admin'), adminLimiter, async (req, res) => {
  await pool.execute('DELETE FROM subtitles WHERE id = :id', { id: req.params.subtitleId });
  res.json({ status: 'ok' });
});

module.exports = router;
