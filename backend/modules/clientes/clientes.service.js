/**
 * @file clientes.service.js
 * @description Lógica de negocio para gestión de clientes.
 * Soporta personas físicas (cédula) y empresas (RNC).
 */

const pool = require('../../config/db');

const listarClientes = async () => {
  const resultado = await pool.query(
    `SELECT id_cliente, tipo_cliente, nombre_completo, cedula_rnc,
            telefono, email, direccion, fecha_registro
     FROM clientes
     ORDER BY fecha_registro DESC`
  );
  return resultado.rows;
};

const obtenerClientePorId = async (id_cliente) => {
  const resultado = await pool.query(
    `SELECT id_cliente, tipo_cliente, nombre_completo, cedula_rnc,
            telefono, email, direccion, fecha_registro
     FROM clientes
     WHERE id_cliente = $1`,
    [id_cliente]
  );

  if (resultado.rowCount === 0) {
    const error = new Error(`No existe un cliente con el ID: ${id_cliente}`);
    error.status = 404;
    throw error;
  }

  return resultado.rows[0];
};

const buscarClientes = async (termino) => {
  const resultado = await pool.query(
    `SELECT id_cliente, tipo_cliente, nombre_completo, cedula_rnc,
            telefono, email, direccion
     FROM clientes
     WHERE nombre_completo ILIKE $1
        OR cedula_rnc      ILIKE $1
        OR telefono        ILIKE $1
     ORDER BY nombre_completo ASC`,
    [`%${termino}%`]
  );
  return resultado.rows;
};

const crearCliente = async ({ tipo_cliente, nombre_completo, cedula_rnc, telefono, email, direccion }) => {
  const existe = await pool.query(
    'SELECT 1 FROM clientes WHERE cedula_rnc = $1',
    [cedula_rnc]
  );

  if (existe.rowCount > 0) {
    const error = new Error(`Ya existe un cliente registrado con la cédula/RNC: ${cedula_rnc}`);
    error.status = 409;
    throw error;
  }

  const resultado = await pool.query(
    `INSERT INTO clientes
       (tipo_cliente, nombre_completo, cedula_rnc, telefono, email, direccion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tipo_cliente || 'persona', nombre_completo, cedula_rnc, telefono, email || null, direccion || null]
  );

  return resultado.rows[0];
};

const actualizarCliente = async (id_cliente, { tipo_cliente, nombre_completo, cedula_rnc, telefono, email, direccion }) => {
  await obtenerClientePorId(id_cliente);

  const resultado = await pool.query(
    `UPDATE clientes
     SET
       tipo_cliente    = COALESCE($1, tipo_cliente),
       nombre_completo = COALESCE($2, nombre_completo),
       cedula_rnc      = COALESCE($3, cedula_rnc),
       telefono        = COALESCE($4, telefono),
       email           = COALESCE($5, email),
       direccion       = COALESCE($6, direccion)
     WHERE id_cliente = $7
     RETURNING *`,
    [tipo_cliente || null, nombre_completo || null, cedula_rnc || null,
     telefono || null, email || null, direccion || null, id_cliente]
  );

  return resultado.rows[0];
};

const eliminarCliente = async (id_cliente) => {
  await obtenerClientePorId(id_cliente);

  const tieneOTs = await pool.query(
    'SELECT 1 FROM ordenes_trabajo WHERE id_cliente = $1 LIMIT 1',
    [id_cliente]
  );

  if (tieneOTs.rowCount > 0) {
    const error = new Error('No se puede eliminar el cliente porque tiene Órdenes de Trabajo asociadas.');
    error.status = 409;
    throw error;
  }

  await pool.query('DELETE FROM clientes WHERE id_cliente = $1', [id_cliente]);

  return { mensaje: 'Cliente eliminado exitosamente.' };
};

module.exports = {
  listarClientes,
  obtenerClientePorId,
  buscarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
};