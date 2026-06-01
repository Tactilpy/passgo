// routes/events.js — CRUD completo de eventos
const router = require('express').Router();
const { pool } = require('../db');
const { authenticate, requirePerm } = require('../middleware/auth');

router.use(authenticate);

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const { org_id, status, search } = req.query;
    let q = `SELECT e.*, o.name as org_name FROM events e
             LEFT JOIN organizations o ON o.id=e.org_id WHERE 1=1`;
    const p = [];
    if (!['SuperAdmin','Admin'].includes(req.user.role)) {
      p.push(req.user.org_id); q += ` AND e.org_id=$${p.length}`;
    } else if (org_id) {
      p.push(org_id); q += ` AND e.org_id=$${p.length}`;
    }
    if (status) { p.push(status); q += ` AND e.status=$${p.length}`; }
    if (search) { p.push(`%${search}%`); q += ` AND e.title ILIKE $${p.length}`; }
    q += ' ORDER BY e.date DESC LIMIT 100';
    const { rows } = await pool.query(q, p);
    res.json({ events: rows });
  } catch (err) { next(err); }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT e.*, o.name as org_name FROM events e LEFT JOIN organizations o ON o.id=e.org_id WHERE e.id=$1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /api/events
router.post('/', requirePerm('create_events'), async (req, res, next) => {
  try {
    const { title, type, date, time_start, time_end, location, capacity=50,
            methods='["facial","qr"]', survey_timing='checkout', confirm_mode='auto',
            payment_type='free', price=0, cert_type='standard', org_id } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    if (!date)          return res.status(400).json({ error: 'Fecha requerida' });

    const slug = title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,40)
                 + '-' + Date.now().toString(36);

    const { rows } = await pool.query(
      `INSERT INTO events (org_id,title,slug,type,date,time_start,time_end,location,capacity,
        methods,survey_timing,confirm_mode,payment_type,price,cert_type,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [org_id||req.user.org_id, title.trim(), slug, type, date,
       time_start||null, time_end||null, location||'', capacity,
       typeof methods==='string'?methods:JSON.stringify(methods),
       survey_timing, confirm_mode, payment_type, price, cert_type, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug duplicado' });
    next(err);
  }
});

// PUT /api/events/:id
router.put('/:id', requirePerm('edit_events'), async (req, res, next) => {
  try {
    const allowed = ['title','type','date','time_start','time_end','location','capacity',
                     'methods','survey_timing','confirm_mode','payment_type','price','status'];
    const updates = []; const vals = [];
    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        vals.push(typeof req.body[f]==='object'?JSON.stringify(req.body[f]):req.body[f]);
        updates.push(`${f}=$${vals.length}`);
      }
    });
    if (!updates.length) return res.status(400).json({ error: 'Sin cambios' });
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE events SET ${updates.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id
router.delete('/:id', requirePerm('delete_events'), async (req, res, next) => {
  try {
    const { rows } = await pool.query('DELETE FROM events WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Eliminado', id: rows[0].id });
  } catch (err) { next(err); }
});

// GET /api/events/slug/:slug — para el registro público
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT e.*, o.name as org_name, o.logo_url FROM events e LEFT JOIN organizations o ON o.id=e.org_id WHERE e.slug=$1',
      [req.params.slug]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
