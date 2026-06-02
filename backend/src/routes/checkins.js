// routes/checkins.js
const router = require('express').Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

// GET /api/checkins?event_id=X
router.get('/', async (req, res, next) => {
  try {
    const { event_id } = req.query;
    let q = 'SELECT c.*,p.nombre,p.apellido,p.email,p.dni FROM checkins c JOIN participants p ON p.id=c.participant_id WHERE 1=1';
    const params = [];
    if (event_id) { params.push(event_id); q += ` AND c.event_id=$${params.length}`; }
    q += ' ORDER BY c.check_in DESC LIMIT 500';
    const { rows } = await pool.query(q, params);
    res.json({ checkins: rows });
  } catch (err) { next(err); }
});

// POST /api/checkins — registrar entrada
router.post('/', async (req, res, next) => {
  try {
    const { participant_id, event_id, method='manual', mode='entry' } = req.body;
    if (!participant_id || !event_id)
      return res.status(400).json({ error: 'participant_id y event_id requeridos' });

    // Anti-duplicados
    const existing = await pool.query(
      'SELECT * FROM checkins WHERE participant_id=$1 AND event_id=$2',
      [participant_id, event_id]
    );

    if (mode === 'entry') {
      if (existing.rows[0]?.status === 'in')
        return res.status(409).json({ error: 'Ya registró entrada', code: 'DUPLICATE_ENTRY' });

      if (existing.rows[0]) {
        // Actualizar a "in" (puede reingresar)
        const { rows } = await pool.query(
          'UPDATE checkins SET status=\'in\', check_in=NOW(), method=$1 WHERE id=$2 RETURNING *',
          [method, existing.rows[0].id]
        );
        return res.json(rows[0]);
      }

      const { rows } = await pool.query(
        'INSERT INTO checkins (participant_id,event_id,method,status,check_in) VALUES ($1,$2,$3,\'in\',NOW()) RETURNING *',
        [participant_id, event_id, method]
      );
      return res.status(201).json(rows[0]);
    }

    if (mode === 'exit') {
      if (!existing.rows[0])
        return res.status(409).json({ error: 'No registró entrada', code: 'NO_ENTRY' });
      if (existing.rows[0].status === 'out')
        return res.status(409).json({ error: 'Ya registró salida', code: 'DUPLICATE_EXIT' });

      const { rows } = await pool.query(
        'UPDATE checkins SET status=\'out\', check_out=NOW() WHERE id=$1 RETURNING *',
        [existing.rows[0].id]
      );
      return res.json(rows[0]);
    }

    res.status(400).json({ error: 'mode debe ser entry o exit' });
  } catch (err) { next(err); }
});

module.exports = router;
