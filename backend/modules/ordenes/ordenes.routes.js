/**
 * @file ordenes.routes.js
 * @description Rutas de Ordenes de Trabajo.
 * Base path: /api/v1/ordenes
 */

const express  = require('express');
const router   = express.Router();
const { verifyToken }              = require('../../middlewares/auth.middleware');
const { adminOEmpleado, otPropiaOAdmin } = require('../../middlewares/roles.middleware');
const { validar }                  = require('../../middlewares/validate.middleware');
const {
  listarOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  agregarPiezaAOrden,
  actualizarEstadoOrden,
  eliminarOrden,
} = require('./ordenes.controller');

/**
 * @route  GET /api/v1/ordenes
 * @desc   Lista ordenes. Admin ve todas, empleado solo las suyas.
 * @access Admin y Empleado
 */
router.get('/', verifyToken, adminOEmpleado, listarOrdenes);

/**
 * @route  GET /api/v1/ordenes/:id_ot
 * @desc   Detalle completo de una OT con sus piezas
 * @access Admin y Empleado
 */
router.get('/:id_ot', verifyToken, adminOEmpleado, obtenerOrdenPorId);

/**
 * @route  POST /api/v1/ordenes
 * @desc   Crea una nueva Orden de Trabajo
 * @access Admin y Empleado
 * @body   { id_cliente, vin, placa, marca, modelo, anio, descripcion_trabajo, mecanico_asignado? }
 */
router.post(
  '/',
  verifyToken,
  adminOEmpleado,
  validar([
    { campo: 'id_cliente',          tipo: 'number', requerido: true  },
    { campo: 'vin',                 tipo: 'string', requerido: true  },
    { campo: 'placa',               tipo: 'string', requerido: true  },
    { campo: 'marca',               tipo: 'string', requerido: true  },
    { campo: 'modelo',              tipo: 'string', requerido: true  },
    { campo: 'anio',                tipo: 'number', requerido: true  },
    { campo: 'descripcion_trabajo', tipo: 'string', requerido: true  },
    { campo: 'mecanico_asignado',   tipo: 'string', requerido: false },
  ]),
  crearOrden
);

/**
 * @route  POST /api/v1/ordenes/agregar-pieza
 * @desc   Agrega una pieza a una OT con flujo transaccional
 * @access Admin y Empleado
 * @body   { id_ot, id_pieza, cantidad }
 */
router.post(
  '/agregar-pieza',
  verifyToken,
  adminOEmpleado,
  validar([
    { campo: 'id_ot',    tipo: 'string', requerido: true },
    { campo: 'id_pieza', tipo: 'number', requerido: true },
    { campo: 'cantidad', tipo: 'number', requerido: true },
  ]),
  agregarPiezaAOrden
);

/**
 * @route  PATCH /api/v1/ordenes/:id_ot/estado
 * @desc   Actualiza el estado de una OT
 * @access Admin y Empleado
 * @body   { estado }
 */
router.patch(
  '/:id_ot/estado',
  verifyToken,
  adminOEmpleado,
  validar([
    { campo: 'estado', tipo: 'string', requerido: true },
  ]),
  actualizarEstadoOrden
);

/**
 * @route  DELETE /api/v1/ordenes/:id_ot
 * @desc   Elimina una OT. Admin elimina cualquiera, empleado solo las suyas.
 * @access Admin y Empleado
 */
router.delete('/:id_ot', verifyToken, otPropiaOAdmin, eliminarOrden);

module.exports = router;