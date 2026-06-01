// middleware/auth.js
const jwt  = require('jsonwebtoken');
const { pool } = require('../db');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Token requerido' });

    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      'SELECT id, email, role, org_id, permissions, active FROM users WHERE id=$1',
      [payload.sub]
    );
    if (!rows[0]?.active)
      return res.status(401).json({ error: 'Usuario inactivo' });

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return res.status(403).json({ error: 'Sin permisos' });
  next();
};

const requirePerm = perm => (req, res, next) => {
  const perms = req.user?.permissions || [];
  if (!perms.includes(perm))
    return res.status(403).json({ error: `Se requiere permiso: ${perm}` });
  next();
};

module.exports = { authenticate, requireRole, requirePerm };
