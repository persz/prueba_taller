/**
 * @file usuarios.controller.js
 * @description Controlador de usuarios.
 * Solo accesible por administradores.
 */

const usuariosService = require('./usuarios.service');

/**
 * @route GET /api/v1/usuarios
 * @desc Lista todos los usuarios del sistema
 */
const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.listarUsuarios();
    return res.status(200).json({
      exitoso: true,
      total: usuarios.length,
      usuarios,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/v1/usuarios/:id
 * @desc Obtiene un usuario por su ID
 */
const obtenerUsuarioPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.obtenerUsuarioPorId(id);
    return res.status(200).json({
      exitoso: true,
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/v1/usuarios
 * @desc Crea un nuevo usuario
 * @body { nombre, email, password, rol }
 */
const crearUsuario = async (req, res, next) => {
  try {
    const usuario = await usuariosService.crearUsuario(req.body);
    return res.status(201).json({
      exitoso: true,
      mensaje: 'Usuario creado exitosamente.',
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route PUT /api/v1/usuarios/:id
 * @desc Actualiza los datos de un usuario
 * @body { nombre?, email?, password?, rol? }
 */
const actualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.actualizarUsuario(id, req.body);
    return res.status(200).json({
      exitoso: true,
      mensaje: 'Usuario actualizado exitosamente.',
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route PATCH /api/v1/usuarios/:id/toggle-activo
 * @desc Activa o desactiva un usuario
 */
const toggleActivoUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.toggleActivoUsuario(id);
    return res.status(200).json({
      exitoso: true,
      mensaje: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente.`,
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  toggleActivoUsuario,
};