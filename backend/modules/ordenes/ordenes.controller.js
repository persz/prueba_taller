/**
 * @file ordenes.controller.js
 * @description Controlador de Ordenes de Trabajo.
 */

const ordenesService = require('./ordenes.service');

/**
 * @route GET /api/v1/ordenes
 * @desc Lista ordenes. Admin ve todas, empleado solo las suyas.
 */
const listarOrdenes = async (req, res, next) => {
  try {
    const ordenes = await ordenesService.listarOrdenes(req.usuario);
    return res.status(200).json({
      exitoso: true,
      total: ordenes.length,
      ordenes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/ordenes/:id_ot
 * @desc Obtiene el detalle completo de una OT con sus piezas
 */
const obtenerOrdenPorId = async (req, res, next) => {
  try {
    const { id_ot } = req.params;
    const resultado = await ordenesService.obtenerOrdenPorId(id_ot);
    return res.status(200).json({
      exitoso: true,
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/ordenes
 * @desc Crea una nueva Orden de Trabajo
 * @body { id_cliente, vin, placa, marca, modelo, anio, descripcion_trabajo, mecanico_asignado? }
 */
const crearOrden = async (req, res, next) => {
  try {
    const orden = await ordenesService.crearOrden({
      ...req.body,
      id_usuario_creador: req.usuario.id_usuario,
    });
    return res.status(201).json({
      exitoso: true,
      mensaje: 'Orden de Trabajo creada exitosamente.',
      orden,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/ordenes/agregar-pieza
 * @desc Agrega una pieza a una OT mediante flujo transaccional
 * @body { id_ot, id_pieza, cantidad }
 */
const agregarPiezaAOrden = async (req, res, next) => {
  try {
    const { id_ot, id_pieza, cantidad } = req.body;
    const resultado = await ordenesService.agregarPiezaAOrden({ id_ot, id_pieza, cantidad });
    return res.status(201).json({
      exitoso: true,
      mensaje: 'Pieza agregada a la Orden de Trabajo exitosamente.',
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route PATCH /api/v1/ordenes/:id_ot/estado
 * @desc Actualiza el estado de una OT
 * @body { estado }
 */
const actualizarEstadoOrden = async (req, res, next) => {
  try {
    const { id_ot } = req.params;
    const { estado } = req.body;
    const orden = await ordenesService.actualizarEstadoOrden(id_ot, estado);
    return res.status(200).json({
      exitoso: true,
      mensaje: `Estado de la OT ${id_ot} actualizado a "${estado}" exitosamente.`,
      orden,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route DELETE /api/v1/ordenes/:id_ot
 * @desc Elimina una OT. Admin elimina cualquiera, empleado solo las suyas.
 */
const eliminarOrden = async (req, res, next) => {
  try {
    const { id_ot } = req.params;
    const resultado = await ordenesService.eliminarOrden(id_ot, req.usuario);
    return res.status(200).json({
      exitoso: true,
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  agregarPiezaAOrden,
  actualizarEstadoOrden,
  eliminarOrden,
};