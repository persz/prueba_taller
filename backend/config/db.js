/**
 * @file db.js
 * @description Pool de conexiones a PostgreSQL.
 */

const path   = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });



// ── Validación de variables de entorno críticas ──────────────────────────────
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`[DB]  Variables de entorno faltantes: ${missingVars.join(', ')}`);
  process.exit(1);
}

// ── Instancia del Pool ───────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max:                     20,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 5000,
});

// ── Verificación de conectividad al iniciar ──────────────────────────────────
pool.connect((err, client, release) => {
  if (err) {
    console.error('[DB]  Error al conectar con PostgreSQL:', err.message);
    return;
  }
  console.log('[DB]  Pool de conexiones PostgreSQL activo.');
  release();
});

// ── Listener de errores del pool ─────────────────────────────────────────────
pool.on('error', (err) => {
  console.error('[DB] S  Error inesperado en el pool:', err.message);
});

module.exports = pool;