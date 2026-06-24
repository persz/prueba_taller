/**
 * @file vehiculos.controller.js
 * @description Controlador de vehículos.
 * Consulta datos en tiempo real desde la API NHTSA usando el VIN.
 */

const vehiculosService = require('./vehiculos.service');

/**
 * @route GET /api/v1/vehiculos/vin/:vin
 * @desc Decodifica un VIN y retorna los datos del vehículo
 * @access Admin y Empleado
 */
const decodificarVIN = async (req, res, next) => {
  try {
    const { vin } = req.params;
    const vehiculo = await vehiculosService.decodificarVIN(vin);

    return res.status(200).json({
      exitoso: true,
      mensaje: 'Vehículo encontrado exitosamente.',
      vehiculo,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { decodificarVIN };