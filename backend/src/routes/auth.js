// routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

const sign = (payload, secret, exp) => jwt.sign(payload, secret, { expiresIn: exp });

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const { rows } = await pool.query(
      `SELECT u.*, o.name as org_name FROM users u
       LEFT JOIN organizations o ON o.id=u.org_id
       WHERE u.email=$1`, [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password_hash))
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    if (!user.active)
      return res.status(401).json({ error: 'Cuenta desactivada' });

    const accessToken  = sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || '8h');
    const refreshToken = sign({ sub: user.id }, process.env.REFRESH_TOKEN_SECRET, '30d');

    await pool.query('UPDATE users SET refresh_token=$1, last_login=NOW() WHERE id=$2', [refreshToken, user.id]);

    res.json({
      accessToken, refreshToken,
      user: {
        id: user.id, nombre: user.nombre, apellido: user.apellido,
        email: user.email, role: user.role, plan: user.plan,
        permissions: user.permissions, org_id: user.org_id,
        org_name: user.org_name, temp_password: user.temp_password,
      },
    });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token requerido' });
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE id=$1 AND refresh_token=$2 AND active=true',
      [payload.sub, refreshToken]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Token inválido' });
    const accessToken = sign({ sub: rows[0].id, role: rows[0].role }, process.env.JWT_SECRET, '8h');
    res.json({ accessToken });
  } catch { res.status(401).json({ error: 'Refresh token inválido' }); }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET refresh_token=NULL WHERE id=$1', [req.user.id]);
    res.json({ message: 'Sesión cerrada' });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  // Siempre 200 para no revelar si el email existe
  res.json({ message: 'Si el email existe recibirás instrucciones.' });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'Mínimo 6 caracteres' });
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    if (!await bcrypt.compare(currentPassword, rows[0].password_hash))
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash=$1, temp_password=false WHERE id=$2', [hash, req.user.id]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) { next(err); }
});

module.exports = router;
