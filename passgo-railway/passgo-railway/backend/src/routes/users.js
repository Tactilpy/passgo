// routes/users.js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users — solo admins
router.get('/', requireRole('SuperAdmin','Admin'), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id,u.nombre,u.apellido,u.email,u.phone,u.role,u.plan,u.active,u.temp_password,
              u.last_login,u.created_at,u.org_id,o.name as org_name,u.permissions
       FROM users u LEFT JOIN organizations o ON o.id=u.org_id ORDER BY u.created_at DESC`
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
});

// POST /api/users — crear usuario
router.post('/', requireRole('SuperAdmin','Admin'), async (req, res, next) => {
  try {
    const { nombre, apellido, email, phone='', password, role='Disertante',
            plan='pro', org_id, permissions=[], active=true } = req.body;

    if (!nombre || !apellido || !email)
      return res.status(400).json({ error: 'Nombre, apellido y email requeridos' });
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'Contraseña mínima 6 caracteres' });

    // Verificar email único
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Email ya registrado' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (nombre,apellido,email,phone,password_hash,role,plan,org_id,permissions,active,temp_password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) RETURNING id,nombre,apellido,email,role,plan,active`,
      [nombre, apellido, email.toLowerCase(), phone, hash, role, plan,
       org_id||null, JSON.stringify(permissions), active]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/users/:id — editar usuario
router.put('/:id', requireRole('SuperAdmin','Admin'), async (req, res, next) => {
  try {
    const { nombre, apellido, email, phone, role, plan, org_id, permissions, active } = req.body;
    const updates = []; const vals = [];
    const map = { nombre, apellido, email, phone, role, plan, org_id, active };
    Object.entries(map).forEach(([k,v]) => {
      if (v !== undefined) { vals.push(v); updates.push(`${k}=$${vals.length}`); }
    });
    if (permissions !== undefined) {
      vals.push(JSON.stringify(permissions));
      updates.push(`permissions=$${vals.length}`);
    }
    if (!updates.length) return res.status(400).json({ error: 'Sin cambios' });
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(',')} WHERE id=$${vals.length} RETURNING id,nombre,apellido,email,role,plan,active`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', requireRole('SuperAdmin','Admin'), async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'No podés eliminarte a vos mismo' });
    const { rows } = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (err) { next(err); }
});

// POST /api/users/:id/reset-password — forzar reset
router.post('/:id/reset-password', requireRole('SuperAdmin','Admin'), async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'Mínimo 6 caracteres' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1, temp_password=true WHERE id=$2', [hash, req.params.id]);
    res.json({ message: 'Contraseña restablecida' });
  } catch (err) { next(err); }
});

module.exports = router;
