/**
 * @file usuarios.service.js
 * @description Lógica de negocio para gestión de usuarios.
 * Solo el administrador puede acceder a estos endpoints.
 */

const bcrypt = require('bcryptjs');
const pool   = require('../../config/db');

/**
 * Retorna todos los usuarios del sistema sin exponer el password_hash.
 */
const listarUsuarios = async () => {
  const resultado = await pool.query(
    `SELECT id_usuario, nombre, email, rol, activo, fecha_registro
     FROM usuarios
     ORDER BY fecha_registro DESC`
  );
  return resultado.rows;
};

/**
 * Retorna un usuario por su ID.
 */
const obtenerUsuarioPorId = async (id_usuario) => {
  const resultado = await pool.query(
    `SELECT id_usuario, nombre, email, rol, activo, fecha_registro
     FROM usuarios
     WHERE id_usuario = $1`,
    [id_usuario]
  );

  if (resultado.rowCount === 0) {
    const error = new Error(`No existe un usuario con el ID: ${id_usuario}`);
    error.status = 404;
    throw error;
  }

  return resultado.rows[0];
};

/**
 * Crea un nuevo usuario hasheando la contraseña con bcrypt.
 */
const crearUsuario = async ({ nombre, email, password, rol }) => {
  // Verificar si el email ya existe
  const emailExiste = await pool.query(
    'SELECT 1 FROM usuarios WHERE email = $1',
    [email]
  );

  if (emailExiste.rowCount > 0) {
    const error = new Error(`Ya existe un usuario registrado con el email: ${email}`);
    error.status = 409;
    throw error;
  }

  // Hashear la contraseña con bcrypt (10 rondas de sal)
  const password_hash = await bcrypt.hash(password, 10);

  const resultado = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING id_usuario, nombre, email, rol, activo, fecha_registro`,
    [nombre, email, password_hash, rol || 'empleado']
  );

  return resultado.rows[0];
};

/**
 * Actualiza los datos de un usuario.
 * Si se envía nueva password, se hashea automáticamente.
 */
const actualizarUsuario = async (id_usuario, { nombre, email, password, rol }) => {
  // Verificar que el usuario existe
  await obtenerUsuarioPorId(id_usuario);

  // Si viene nueva password, hashearla
  let password_hash = undefined;
  if (password) {
    password_hash = await bcrypt.hash(password, 10);
  }

  const resultado = await pool.query(
    `UPDATE usuarios
     SET
       nombre        = COALESCE($1, nombre),
       email         = COALESCE($2, email),
       password_hash = COALESCE($3, password_hash),
       rol           = COALESCE($4, rol)
     WHERE id_usuario = $5
     RETURNING id_usuario, nombre, email, rol, activo, fecha_registro`,
    [nombre || null, email || null, password_hash || null, rol || null, id_usuario]
  );

  return resultado.rows[0];
};

/**
 * Activa o desactiva un usuario (soft delete).
 * No se eliminan usuarios para preservar el historial de OTs.
 */
const toggleActivoUsuario = async (id_usuario) => {
  await obtenerUsuarioPorId(id_usuario);

  const resultado = await pool.query(
    `UPDATE usuarios
     SET activo = NOT activo
     WHERE id_usuario = $1
     RETURNING id_usuario, nombre, email, rol, activo`,
    [id_usuario]
  );

  return resultado.rows[0];
};

module.exports = {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  toggleActivoUsuario,
};