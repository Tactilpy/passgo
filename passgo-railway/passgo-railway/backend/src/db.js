// db.js — Railway provee DATABASE_URL automáticamente al conectar PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  // Railway inyecta DATABASE_URL cuando conectás el plugin de PostgreSQL
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // Railway requiere SSL
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', err => console.error('[DB Pool Error]', err.message));

// Test de conexión al arrancar
pool.query('SELECT NOW()').then(r => {
  console.log(`✅ PostgreSQL conectado [${r.rows[0].now}]`);
}).catch(err => {
  console.error('❌ Error de conexión a DB:', err.message);
  // En Railway, la DB puede tardar unos segundos en estar lista
  // No hacemos process.exit para que Railway pueda reintentar
});

module.exports = { pool };
