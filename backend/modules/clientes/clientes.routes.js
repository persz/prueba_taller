/**
 * @file clientes.routes.js
 * @description Rutas de gestión de clientes.
 * Admin y empleados pueden crear y consultar.
 * Solo admin puede eliminar.
 * Base path: /api/v1/clientes
 */
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../../middlewares/auth.middleware');
const { soloAdmin, adminOEmpleado } = require('../../middlewares/roles.middleware');
const { validar }       = require('../../middlewares/validate.middleware');
const {
  listarClientes,
  buscarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} = require('./clientes.controller');

/**
 * @route  GET /api/v1/clientes
 * @desc   Lista todos los clientes
 * @access Admin y Empleado
 */
router.get('/', verifyToken, adminOEmpleado, listarClientes);

/**
 * @route  GET /api/v1/clientes/buscar?termino=
 * @desc   Busca clientes por nombre, cédula/RNC o teléfono
 * @access Admin y Empleado
 */
router.get('/buscar', verifyToken, adminOEmpleado, buscarClientes);

/**
 * @route  GET /api/v1/clientes/:id
 * @desc   Obtiene un cliente por ID
 * @access Admin y Empleado
 */
router.get('/:id', verifyToken, adminOEmpleado, obtenerClientePorId);

/**
 * @route  POST /api/v1/clientes
 * @desc   Crea un nuevo cliente
 * @access Admin y Empleado
 * @body   { tipo_cliente?, nombre_completo, cedula_rnc, telefono, email?, direccion? }
 */
router.post(
  '/',
  verifyToken,
  adminOEmpleado,
  validar([
    { campo: 'nombre_completo', tipo: 'string', requerido: true  },
    { campo: 'cedula_rnc',      tipo: 'string', requerido: true  },
    { campo: 'telefono',        tipo: 'string', requerido: true  },
    { campo: 'tipo_cliente',    tipo: 'string', requerido: false },
    { campo: 'email',           tipo: 'string', requerido: false },
    { campo: 'direccion',       tipo: 'string', requerido: false },
  ]),
  crearCliente
);

/**
 * @route  PUT /api/v1/clientes/:id
 * @desc   Actualiza los datos de un cliente
 * @access Admin y Empleado
 */
router.put(
  '/:id',
  verifyToken,
  adminOEmpleado,
  validar([
    { campo: 'nombre_completo', tipo: 'string', requerido: false },
    { campo: 'cedula_rnc',      tipo: 'string', requerido: false },
    { campo: 'telefono',        tipo: 'string', requerido: false },
    { campo: 'tipo_cliente',    tipo: 'string', requerido: false },
    { campo: 'email',           tipo: 'string', requerido: false },
    { campo: 'direccion',       tipo: 'string', requerido: false },
  ]),
  actualizarCliente
);

/**
 * @route  DELETE /api/v1/clientes/:id
 * @desc   Elimina un cliente si no tiene OTs asociadas
 * @access Solo Admin
 */
router.delete('/:id', verifyToken, soloAdmin, eliminarCliente);

module.exports = router;