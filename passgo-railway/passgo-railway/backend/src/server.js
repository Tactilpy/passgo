// ============================================================
// PASSGO — Backend API v2.0
// Railway-ready: lee DATABASE_URL automáticamente
// ============================================================
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app = express();

// ── Seguridad ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy:"cross-origin" } }));
app.use(compression());
app.set('trust proxy', 1); // Railway usa proxy

// CORS — permite el frontend de Railway o cualquier origen en dev
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS bloqueado: ' + origin));
  },
  credentials: true,
}));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 10 }));

// Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rutas ────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/participants',  require('./routes/participants'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/checkins',      require('./routes/checkins'));
app.use('/api/speakers',      require('./routes/speakers'));
app.use('/api/certificates',  require('./routes/certificates'));
app.use('/api/surveys',       require('./routes/surveys'));
app.use('/api/comm',          require('./routes/comm'));
app.use('/api/reports',       require('./routes/reports'));

// Health check — Railway lo usa para saber si el servicio está vivo
app.get('/health', (req, res) => res.json({
  status:    'ok',
  env:       process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
}));

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[ERROR] ${err.message}`, { url: req.url, method: req.method });
  res.status(status).json({
    error:   process.env.NODE_ENV === 'production' ? 'Error del servidor' : err.message,
    code:    err.code || 'INTERNAL_ERROR',
  });
});

// ── Inicio ───────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Passgo API en puerto ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
