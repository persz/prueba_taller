/**
 * @file facturas.controller.js
 * @description Controlador de facturas.
 * Admin: CRUD completo incluyendo anulacion.
 * Empleado: puede generar facturas, no puede anular.
 */

const facturasService = require('./facturas.service');

/**
 * @route GET /api/v1/facturas
 * @desc Lista todas las facturas
 * @access Admin
 */
const listarFacturas = async (req, res, next) => {
  try {
    const facturas = await facturasService.listarFacturas();
    return res.status(200).json({
      exitoso: true,
      total: facturas.length,
      facturas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/facturas/:id
 * @desc Obtiene el detalle completo de una factura
 * @access Admin y Empleado
 */
const obtenerFacturaPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await facturasService.obtenerFacturaPorId(id);
    return res.status(200).json({
      exitoso: true,
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/facturas/generar
 * @desc Genera una factura a partir de una OT completada
 * @access Admin y Empleado
 * @body { id_unico_ot }
 */
const generarFactura = async (req, res, next) => {
  try {
    const { id_unico_ot, mano_de_obra, cargos_extra, descripcion_cargos } = req.body;

    if (!id_unico_ot) {
      return res.status(400).json({
        exitoso: false,
        mensaje: 'El campo id_unico_ot es obligatorio.',
      });
    }

    const factura = await facturasService.generarFactura(
      id_unico_ot,
      mano_de_obra || 0,
      cargos_extra || 0,
      descripcion_cargos || null
    );

    return res.status(201).json({
      exitoso: true,
      mensaje: 'Factura generada exitosamente.',
      factura,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @route PATCH /api/v1/facturas/:id/anular
 * @desc Anula una factura emitida
 * @access Solo Admin
 * @body { motivo_anulacion }
 */
const anularFactura = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo_anulacion } = req.body;

    if (!motivo_anulacion || motivo_anulacion.trim() === '') {
      return res.status(400).json({
        exitoso: false,
        mensaje: 'El campo motivo_anulacion es obligatorio para anular una factura.',
      });
    }

    const factura = await facturasService.anularFactura(id, motivo_anulacion);
    return res.status(200).json({
      exitoso: true,
      mensaje: `Factura #${id} anulada exitosamente.`,
      factura,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarFacturas,
  obtenerFacturaPorId,
  generarFactura,
  anularFactura,
};