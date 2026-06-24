/**
 * @file facturas.routes.js
 * @description Rutas de gestion de facturas.
 * Base path: /api/v1/facturas
 */

const express  = require('express');
const router   = express.Router();
const { verifyToken }            = require('../../middlewares/auth.middleware');
const { soloAdmin, adminOEmpleado } = require('../../middlewares/roles.middleware');
const {
  listarFacturas,
  obtenerFacturaPorId,
  generarFactura,
  anularFactura,
} = require('./facturas.controller');

/**
 * @route  GET /api/v1/facturas
 * @desc   Lista todas las facturas
 * @access Solo Admin
 */
router.get('/', verifyToken, soloAdmin, listarFacturas);

/**
 * @route  GET /api/v1/facturas/:id
 * @desc   Detalle completo de una factura
 * @access Admin y Empleado
 */
router.get('/:id', verifyToken, adminOEmpleado, obtenerFacturaPorId);

/**
 * @route  POST /api/v1/facturas/generar
 * @desc   Genera una factura desde una OT completada
 * @access Admin y Empleado
 * @body   { id_unico_ot }
 */
router.post('/generar', verifyToken, adminOEmpleado, generarFactura);

/**
 * @route  PATCH /api/v1/facturas/:id/anular
 * @desc   Anula una factura emitida
 * @access Solo Admin
 * @body   { motivo_anulacion }
 */
router.patch('/:id/anular', verifyToken, soloAdmin, anularFactura);

module.exports = router;