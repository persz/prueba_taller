/**
 * @file reportes.routes.js
 * @description Rutas de reportes y dashboard.
 * Todas las rutas son exclusivas del administrador.
 * Base path: /api/v1/reportes
 */

const express  = require('express');
const router   = express.Router();
const { verifyToken } = require('../../middlewares/auth.middleware');
const { soloAdmin }   = require('../../middlewares/roles.middleware');
const {
  getDashboard,
  getReporteIngresos,
  getReportePiezasMasUsadas,
  getReportePorMecanico,
} = require('./reportes.controller');

/**
 * @route  GET /api/v1/reportes/dashboard
 * @desc   Resumen general del negocio
 * @access Solo Admin
 */
router.get('/dashboard', verifyToken, soloAdmin, getDashboard);

/**
 * @route  GET /api/v1/reportes/ingresos?desde=&hasta=
 * @desc   Reporte de ingresos por periodo
 * @access Solo Admin
 */
router.get('/ingresos', verifyToken, soloAdmin, getReporteIngresos);

/**
 * @route  GET /api/v1/reportes/piezas-mas-usadas
 * @desc   Reporte de piezas mas utilizadas
 * @access Solo Admin
 */
router.get('/piezas-mas-usadas', verifyToken, soloAdmin, getReportePiezasMasUsadas);

/**
 * @route  GET /api/v1/reportes/por-mecanico
 * @desc   Reporte de OT agrupadas por mecanico
 * @access Solo Admin
 */
router.get('/por-mecanico', verifyToken, soloAdmin, getReportePorMecanico);

module.exports = router;