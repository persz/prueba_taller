/**
 * @file auth.service.js
 * @description Lógica de negocio para autenticación.
 * Maneja la comparación de contraseñas con bcrypt
 * y la generación de tokens JWT.
 */

const bcrypt         = require('bcryptjs');
const pool           = require('../../config/db');
const { generarToken } = require('../../config/jwt');

/**
 * Autentica un usuario con email y password.
 * @param {string} email
 * @param {string} password - Password en texto plano
 * @returns {object} { usuario, token }
 * @throws {Error} Si el usuario no existe, está inactivo o la password es incorrecta
 */
const login = async (email, password) => {
  // ── Buscar usuario por email ─────────────────────────────────────────────
  const resultado = await pool.query(
    `SELECT id_usuario, nombre, email, password_hash, rol, activo
     FROM usuarios
     WHERE email = $1`,
    [email]
  );

  if (resultado.rowCount === 0) {
    const error = new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
    error.status = 401;
    throw error;
  }

  const usuario = resultado.rows[0];

  // ── Verificar si el usuario está activo ──────────────────────────────────
  if (!usuario.activo) {
    const error = new Error('Tu cuenta está desactivada. Contacta al administrador.');
    error.status = 403;
    throw error;
  }

  // ── Comparar password con el hash almacenado ─────────────────────────────
  const passwordValida = await bcrypt.compare(password, usuario.password_hash);

  if (!passwordValida) {
    const error = new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
    error.status = 401;
    throw error;
  }

  // ── Generar token JWT ────────────────────────────────────────────────────
  const token = generarToken({
    id_usuario: usuario.id_usuario,
    email:      usuario.email,
    rol:        usuario.rol,
  });

  // Retornar usuario sin el password_hash
  const { password_hash, ...usuarioSinPassword } = usuario;

  return { usuario: usuarioSinPassword, token };
};

module.exports = { login };