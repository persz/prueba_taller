/**
 * @file reportes.controller.js
 * @description Controlador de reportes y dashboard.
 * Solo accesible por administradores.
 */

const reportesService = require('./reportes.service');

/**
 * @route GET /api/v1/reportes/dashboard
 * @desc Resumen general del negocio
 */
const getDashboard = async (req, res, next) => {
  try {
    const dashboard = await reportesService.getDashboard();
    return res.status(200).json({
      exitoso: true,
      dashboard,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/reportes/ingresos?desde=&hasta=
 * @desc Reporte de ingresos por periodo
 */
const getReporteIngresos = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const reporte = await reportesService.getReporteIngresos(desde, hasta);
    return res.status(200).json({
      exitoso: true,
      reporte,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/reportes/piezas-mas-usadas
 * @desc Reporte de piezas mas utilizadas en OT
 */
const getReportePiezasMasUsadas = async (req, res, next) => {
  try {
    const piezas = await reportesService.getReportePiezasMasUsadas();
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
 * @route GET /api/v1/reportes/por-mecanico
 * @desc Reporte de OT por mecanico
 */
const getReportePorMecanico = async (req, res, next) => {
  try {
    const mecanicos = await reportesService.getReportePorMecanico();
    return res.status(200).json({
      exitoso: true,
      total: mecanicos.length,
      mecanicos,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getReporteIngresos,
  getReportePiezasMasUsadas,
  getReportePorMecanico,
};