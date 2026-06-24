/**
 * @file server.js
 * @description Punto de entrada principal del servidor Express.
 * Registra middlewares globales, monta todas las rutas del sistema
 * y arranca el servidor en el puerto configurado.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const app = express();

// ── Middlewares globales de seguridad y utilidad ─────────────────────────────
app.use(helmet());                           // Headers de seguridad HTTP
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());                     // Parseo de body JSON
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));                       // Log de requests en consola

// ── Rutas del sistema ────────────────────────────────────────────────────────
const authRoutes       = require('./modules/auth/auth.routes');
const usuariosRoutes   = require('./modules/usuarios/usuarios.routes');
const clientesRoutes   = require('./modules/clientes/clientes.routes');
const vehiculosRoutes  = require('./modules/vehiculos/vehiculos.routes');
const inventarioRoutes = require('./modules/inventario/inventario.routes');
const ordenesRoutes    = require('./modules/ordenes/ordenes.routes');
const facturasRoutes   = require('./modules/facturas/facturas.routes');
const reportesRoutes   = require('./modules/reportes/reportes.routes');

app.use('/api/v1/auth',       authRoutes);
app.use('/api/v1/usuarios',   usuariosRoutes);
app.use('/api/v1/clientes',   clientesRoutes);
app.use('/api/v1/vehiculos',  vehiculosRoutes);
app.use('/api/v1/inventario', inventarioRoutes);
app.use('/api/v1/ordenes',    ordenesRoutes);
app.use('/api/v1/facturas',   facturasRoutes);
app.use('/api/v1/reportes',   reportesRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    exitoso: true,
    mensaje: 'Servidor funcionando correctamente.',
    entorno: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ── Ruta no encontrada (404) ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    exitoso: false,
    mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada.`,
  });
});

// ── Middleware de errores centralizado (debe ser el último) ──────────────────
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

// ── Arranque del servidor ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Servidor activo en http://localhost:${PORT}`);
  console.log(`[SERVER] Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;