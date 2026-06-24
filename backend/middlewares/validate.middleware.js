/**
 * @file validate.middleware.js
 * @description Middleware de validación y sanitización de datos de entrada.
 * Verifica que los campos requeridos estén presentes y con el tipo correcto
 * antes de que lleguen al controlador, evitando errores NOT NULL en PostgreSQL.
 */

/**
 * Fábrica de validadores. Recibe un array de reglas y retorna un middleware.
 * @param {Array} campos - Lista de campos a validar con sus reglas.
 * @returns {Function} Middleware de Express
 *
 * @example
 * validar([
 *   { campo: 'email',    tipo: 'string',  requerido: true  },
 *   { campo: 'edad',     tipo: 'number',  requerido: false },
 * ])
 */
const validar = (campos) => {
  return (req, res, next) => {
    const errores = [];

    campos.forEach(({ campo, tipo, requerido = true }) => {
      const valor = req.body[campo];

      // ── Verificar si el campo es requerido y está presente ───────────────
      if (requerido && (valor === undefined || valor === null || valor === '')) {
        errores.push(`El campo '${campo}' es obligatorio.`);
        return;
      }

      // Si no es requerido y no viene, se omite la validación de tipo
      if (!requerido && (valor === undefined || valor === null || valor === '')) {
        return;
      }

      // ── Verificar el tipo de dato ────────────────────────────────────────
      if (tipo === 'number' && isNaN(Number(valor))) {
        errores.push(`El campo '${campo}' debe ser un número válido.`);
      }

      if (tipo === 'string' && typeof valor !== 'string') {
        errores.push(`El campo '${campo}' debe ser texto.`);
      }

      if (tipo === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(valor)) {
          errores.push(`El campo '${campo}' debe ser un email válido.`);
        }
      }

      if (tipo === 'boolean' && typeof valor !== 'boolean') {
        errores.push(`El campo '${campo}' debe ser verdadero o falso.`);
      }
    });

    // ── Si hay errores, responder antes de llegar al controlador ─────────
    if (errores.length > 0) {
      return res.status(400).json({
        exitoso: false,
        mensaje: 'Error de validación. Revisa los campos enviados.',
        errores,
      });
    }

    next();
  };
};

module.exports = { validar };