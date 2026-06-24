/**
 * @file auth.controller.js
 * @description Controlador de autenticación.
 * Recibe los requests HTTP y delega la lógica al servicio.
 */

const authService = require('./auth.service');

/**
 * @controller loginController
 * @route POST /api/v1/auth/login
 * @desc Autentica un usuario y retorna un token JWT.
 * @body { email, password }
 */
const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { usuario, token } = await authService.login(email, password);

    return res.status(200).json({
      exitoso: true,
      mensaje: `Bienvenido, ${usuario.nombre}.`,
      token,
      usuario,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @controller logoutController
 * @route POST /api/v1/auth/logout
 * @desc Cierra la sesión del usuario.
 * En JWT el logout se maneja del lado del cliente eliminando el token.
 * Este endpoint existe para registrar el evento y dar feedback al frontend.
 */
const logoutController = (req, res) => {
  return res.status(200).json({
    exitoso: true,
    mensaje: 'Sesión cerrada exitosamente. Elimina el token del cliente.',
  });
};

/**
 * @controller perfilController
 * @route GET /api/v1/auth/perfil
 * @desc Retorna los datos del usuario autenticado.
 * Requiere token JWT válido.
 */
const perfilController = (req, res) => {
  return res.status(200).json({
    exitoso: true,
    usuario: req.usuario,
  });
};

module.exports = { loginController, logoutController, perfilController };