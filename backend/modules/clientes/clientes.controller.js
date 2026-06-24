/**
 * @file clientes.controller.js
 * @description Controlador de clientes.
 * Accesible por admin y empleados.
 */

const clientesService = require('./clientes.service');

/**
 * @route GET /api/v1/clientes
 * @desc Lista todos los clientes
 */
const listarClientes = async (req, res, next) => {
  try {
    const clientes = await clientesService.listarClientes();
    return res.status(200).json({
      exitoso: true,
      total: clientes.length,
      clientes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/clientes/buscar?termino=
 * @desc Busca clientes por nombre, cédula/RNC o teléfono
 */
const buscarClientes = async (req, res, next) => {
  try {
    const { termino } = req.query;

    if (!termino || termino.trim() === '') {
      return res.status(400).json({
        exitoso: false,
        mensaje: 'El parámetro de búsqueda "termino" es requerido.',
      });
    }

    const clientes = await clientesService.buscarClientes(termino.trim());
    return res.status(200).json({
      exitoso: true,
      total: clientes.length,
      clientes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/clientes/:id
 * @desc Obtiene un cliente por ID
 */
const obtenerClientePorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cliente = await clientesService.obtenerClientePorId(id);
    return res.status(200).json({
      exitoso: true,
      cliente,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/clientes
 * @desc Crea un nuevo cliente
 * @body { tipo_cliente, nombre_completo, cedula_rnc, telefono, email?, direccion? }
 */
const crearCliente = async (req, res, next) => {
  try {
    const cliente = await clientesService.crearCliente(req.body);
    return res.status(201).json({
      exitoso: true,
      mensaje: 'Cliente registrado exitosamente.',
      cliente,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route PUT /api/v1/clientes/:id
 * @desc Actualiza los datos de un cliente
 */
const actualizarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cliente = await clientesService.actualizarCliente(id, req.body);
    return res.status(200).json({
      exitoso: true,
      mensaje: 'Cliente actualizado exitosamente.',
      cliente,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route DELETE /api/v1/clientes/:id
 * @desc Elimina un cliente si no tiene OTs asociadas
 */
const eliminarCliente = async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await clientesService.eliminarCliente(id);
    return res.status(200).json({
      exitoso: true,
      ...resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarClientes,
  buscarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};