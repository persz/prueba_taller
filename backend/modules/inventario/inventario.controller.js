/**
 * @file inventario.controller.js
 * @description Controlador de inventario de piezas.
 * Admin: CRUD completo.
 * Empleado: solo consultas.
 */

const inventarioService = require('./inventario.service');

/**
 * @route GET /api/v1/inventario
 * @desc Lista todas las piezas del inventario
 */
const listarPiezas = async (req, res, next) => {
  try {
    const piezas = await inventarioService.listarPiezas();
    return res.status(200).json({
      exitoso: true,
      total: piezas.length,
      piezas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/inventario/bajo-stock
 * @desc Lista piezas con stock por debajo del mínimo
 */
const listarPiezasBajoStock = async (req, res, next) => {
  try {
    const piezas = await inventarioService.listarPiezasBajoStock();
    return res.status(200).json({
      exitoso: true,
      total: piezas.length,
      alerta: piezas.length > 0 ? `Hay ${piezas.length} pieza(s) con stock crítico.` : 'Todos los stocks están en nivel normal.',
      piezas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/inventario/buscar?termino=
 * @desc Busca piezas por nombre, SKU o categoría
 */
const buscarPiezas = async (req, res, next) => {
  try {
    const { termino } = req.query;

    if (!termino || termino.trim() === '') {
      return res.status(400).json({
        exitoso: false,
        mensaje: 'El parámetro de búsqueda "termino" es requerido.',
      });
    }

    const piezas = await inventarioService.buscarPiezas(termino.trim());
    return res.status(200).json({
      exitoso: true,
      total: piezas.length,
      piezas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/inventario/:id
 * @desc Obtiene una pieza por ID
 */
const obtenerPiezaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pieza = await inventarioService.obtenerPiezaPorId(id);
    return res.status(200).json({
      exitoso: true,
      pieza,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/inventario
 * @desc Crea una nueva pieza en el inventario
 * @access Solo Admin
 */
const crearPieza = async (req, res, next) => {
  try {
    const pieza = await inventarioService.crearPieza(req.body);
    return res.status(201).json({
      exitoso: true,
      mensaje: 'Pieza agregada al inventario exitosamente.',
      pieza,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route PUT /api/v1/inventario/:id
 * @desc Actualiza los datos de una pieza
 * @access Solo Admin
 */
const actualizarPieza = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pieza = await inventarioService.actualizarPieza(id, req.body);
    return res.status(200).json({
      exitoso: true,
      mensaje: 'Pieza actualizada exitosamente.',
      pieza,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route DELETE /api/v1/inventario/:id
 * @desc Elimina una pieza si no tiene órdenes asociadas
 * @access Solo Admin
 */
const eliminarPieza = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await inventarioService.eliminarPieza(id);
    return res.status(200).json({
      exitoso: true,
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarPiezas,
  listarPiezasBajoStock,
  buscarPiezas,
  obtenerPiezaPorId,
  crearPieza,
  actualizarPieza,
  eliminarPieza,
};