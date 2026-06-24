/**
 * @file jwt.js
 * @description Configuración centralizada de JWT.
 */

const path   = require('path');
const dotenv = require('dotenv');
const jwt    = require('jsonwebtoken');

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET) {
  console.error('[JWT]  JWT_SECRET no está definido en las variables de entorno.');
  process.exit(1);
}

/**
 * Genera un token JWT firmado con los datos del usuario.
 * @param {object} payload - { id_usuario, email, rol }
 * @returns {string} Token JWT
 */
const generarToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifica y decodifica un token JWT.
 * @param {string} token
 * @returns {object} Payload decodificado
 */
const verificarToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = { generarToken, verificarToken };