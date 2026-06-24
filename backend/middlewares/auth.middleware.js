/**
 * @file auth.middleware.js
 * @description Verifica que el request tenga un JWT válido en el header.
 * Si el token es válido, adjunta los datos del usuario a req.usuario
 * para que los controladores puedan acceder a ellos.
 */

const { verificarToken } = require('../config/jwt');

const verifyToken = (req, res, next) => {
  // ── Extraer token del header Authorization ───────────────────────────────
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      exitoso: false,
      mensaje: 'Acceso denegado. No se proporcionó un token de autenticación.',
    });
  }

  // El header debe venir como: "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      exitoso: false,
      mensaje: 'Formato de token inválido. Usa el formato: Bearer <token>',
    });
  }

  // ── Verificar y decodificar el token ─────────────────────────────────────
  try {
    const payload = verificarToken(token);

    // Adjunta los datos del usuario al request para uso en controladores
    // payload contiene: { id_usuario, email, rol }
    req.usuario = payload;

    next();
  } catch (error) {
    // El error se pasa al error.middleware.js para manejarlo
    next(error);
  }
};

module.exports = { verifyToken };