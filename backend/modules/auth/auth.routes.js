/**
 * @file auth.routes.js
 * @description Rutas de autenticación.
 * Base path: /api/v1/auth
 */

const express    = require('express');
const router     = express.Router();
const { validar } = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');
const {
  loginController,
  logoutController,
  perfilController,
} = require('./auth.controller');

/**
 * @route  POST /api/v1/auth/login
 * @desc   Autentica un usuario y retorna JWT
 * @access Público
 * @body   { email, password }
 */
router.post(
  '/login',
  validar([
    { campo: 'email',    tipo: 'email',  requerido: true },
    { campo: 'password', tipo: 'string', requerido: true },
  ]),
  loginController
);

/**
 * @route  POST /api/v1/auth/logout
 * @desc   Cierra la sesión del usuario
 * @access Privado
 */
router.post('/logout', verifyToken, logoutController);

/**
 * @route  GET /api/v1/auth/perfil
 * @desc   Retorna los datos del usuario autenticado
 * @access Privado
 */
router.get('/perfil', verifyToken, perfilController);

module.exports = router;