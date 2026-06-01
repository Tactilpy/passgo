// migrate.js — Railway ejecuta esto durante el build (npm run migrate)
// Lee el schema.sql y lo aplica automáticamente
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Aplicando migraciones...');

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const seedsPath  = path.join(__dirname, '../../database/seeds.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ Schema aplicado');
    }

    if (fs.existsSync(seedsPath)) {
      const seeds = fs.readFileSync(seedsPath, 'utf8');
      await pool.query(seeds);
      console.log('✅ Seeds aplicados');
    }

    console.log('✅ Migraciones completadas');
  } catch (err) {
    // Si las tablas ya existen, está bien
    if (err.code === '42P07' || err.message.includes('already exists')) {
      console.log('ℹ️  Las tablas ya existen, saltando...');
    } else {
      console.error('❌ Error en migración:', err.message);
      // No hacer exit(1) para que Railway no falle el build por seeds duplicados
    }
  } finally {
    await pool.end();
  }
}

migrate();
