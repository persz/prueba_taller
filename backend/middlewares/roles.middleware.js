/**
 * @file roles.middleware.js
 * @description Middlewares de control de acceso por rol.
 * Se usan después de verifyToken para restringir rutas
 * según el rol del usuario autenticado.
 *
 * Roles disponibles: 'admin', 'empleado'
 */

/**
 * Solo permite acceso a administradores.
 * Usar en rutas exclusivas de admin: usuarios, reportes, configuración.
 */
const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
      exitoso: false,
      mensaje: 'Acceso denegado. Se requieren permisos de administrador para esta acción.',
    });
  }
  next();
};

/**
 * Permite acceso a admin y empleado.
 * Usar en rutas compartidas: crear OT, generar facturas, consultar clientes.
 */
const adminOEmpleado = (req, res, next) => {
  const rolesPermitidos = ['admin', 'empleado'];
  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({
      exitoso: false,
      mensaje: 'Acceso denegado. No tienes permisos para esta acción.',
    });
  }
  next();
};

/**
 * Permite eliminar una OT solo si:
 * - El usuario es admin (puede eliminar cualquier OT), O
 * - El usuario es el creador de esa OT (empleado elimina solo las suyas).
 * 
 * IMPORTANTE: Este middleware requiere que el controlador valide
 * el id_usuario_creador contra req.usuario.id_usuario.
 * Se usa en conjunto con la lógica del controlador de órdenes.
 */
const otPropiaOAdmin = (req, res, next) => {
  // La validación específica de si la OT le pertenece al empleado
  // se hace en el controlador porque requiere consultar la BD.
  // Este middleware solo verifica que el rol sea válido.
  const rolesPermitidos = ['admin', 'empleado'];
  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({
      exitoso: false,
      mensaje: 'Acceso denegado. No tienes permisos para eliminar esta Orden de Trabajo.',
    });
  }
  next();
};

module.exports = { soloAdmin, adminOEmpleado, otPropiaOAdmin };