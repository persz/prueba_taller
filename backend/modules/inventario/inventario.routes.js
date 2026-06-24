const express  = require('express');
const router   = express.Router();
const { verifyToken }            = require('../../middlewares/auth.middleware');
const { soloAdmin, adminOEmpleado } = require('../../middlewares/roles.middleware');
const { validar }                = require('../../middlewares/validate.middleware');
const {
  listarPiezas,
  listarPiezasBajoStock,
  buscarPiezas,
  obtenerPiezaPorId,
  crearPieza,
  actualizarPieza,
  eliminarPieza,
} = require('./inventario.controller');

router.get('/', verifyToken, adminOEmpleado, listarPiezas);
router.get('/bajo-stock', verifyToken, adminOEmpleado, listarPiezasBajoStock);
router.get('/buscar', verifyToken, adminOEmpleado, buscarPiezas);
router.get('/:id', verifyToken, adminOEmpleado, obtenerPiezaPorId);
router.post('/', verifyToken, soloAdmin, validar([
    { campo: 'codigo_sku',     tipo: 'string', requerido: true },
    { campo: 'nombre',         tipo: 'string', requerido: true },
    { campo: 'categoria_tipo', tipo: 'string', requerido: true },
    { campo: 'stock_actual',   tipo: 'number', requerido: true },
    { campo: 'stock_minimo',   tipo: 'number', requerido: true },
    { campo: 'precio_costo',   tipo: 'number', requerido: true },
    { campo: 'precio_venta',   tipo: 'number', requerido: true },
]), crearPieza);
router.put('/:id', verifyToken, soloAdmin, actualizarPieza);
router.delete('/:id', verifyToken, soloAdmin, eliminarPieza);

module.exports = router;