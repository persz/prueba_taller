/**
 * @file error.middleware.js
 * @description Middleware centralizado de manejo de errores.
 * Captura cualquier error no controlado y responde siempre
 * con un JSON estructurado. Nunca expone stack traces en producción.
 */

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err.message);

  const esProduccion = process.env.NODE_ENV === 'production';

  // ── Mapeo de códigos de error nativos de PostgreSQL ──────────────────────
  const pgErrorMap = {
    '23502': { status: 400, mensaje: 'Campo requerido vacío. Verifica que todos los campos obligatorios estén completos.' },
    '23503': { status: 409, mensaje: 'El registro referenciado no existe. Verifica los IDs enviados.' },
    '23505': { status: 409, mensaje: 'Ya existe un registro con ese identificador único.' },
    '42703': { status: 400, mensaje: 'Columna inexistente en la base de datos. Contacta al administrador.' },
    '42P01': { status: 400, mensaje: 'Tabla inexistente en la base de datos. Contacta al administrador.' },
    '22P02': { status: 400, mensaje: 'Tipo de dato inválido. Verifica que los campos numéricos sean números.' },
  };

  const pgError = pgErrorMap[err.code];
  if (pgError) {
    return res.status(pgError.status).json({
      exitoso: false,
      mensaje: pgError.mensaje,
      codigo_pg: err.code,
      error: esProduccion ? undefined : err.message,
    });
  }

  // ── Error de JWT ─────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      exitoso: false,
      mensaje: 'Token inválido. Inicia sesión nuevamente.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      exitoso: false,
      mensaje: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
    });
  }

  // ── Error genérico ───────────────────────────────────────────────────────
  return res.status(err.status || 500).json({
    exitoso: false,
    mensaje: err.message || 'Error interno del servidor.',
    error: esProduccion ? 'Contacta al administrador del sistema.' : err.stack,
  });
};

module.exports = errorHandler;

