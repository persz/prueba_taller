/**
 * @file inventario.service.js
 * @description Lógica de negocio para gestión de inventario de piezas.
 * Solo administradores pueden crear, editar y eliminar piezas.
 * Empleados solo pueden consultar el stock.
 */

const pool       = require('../../config/db');
const transporter = require('../../config/nodemailer');

/**
 * Retorna todas las piezas del inventario.
 */
const listarPiezas = async () => {
  const resultado = await pool.query(
    `SELECT id_pieza, codigo_sku, nombre, categoria_tipo,
            stock_actual, stock_minimo, precio_costo, precio_venta, fecha_registro
     FROM inventario_piezas
     ORDER BY categoria_tipo ASC, nombre ASC`
  );
  return resultado.rows;
};

/**
 * Retorna las piezas con stock por debajo del mínimo.
 */
const listarPiezasBajoStock = async () => {
  const resultado = await pool.query(
    `SELECT id_pieza, codigo_sku, nombre, categoria_tipo,
            stock_actual, stock_minimo, precio_venta
     FROM inventario_piezas
     WHERE stock_actual <= stock_minimo
     ORDER BY stock_actual ASC`
  );
  return resultado.rows;
};

/**
 * Retorna una pieza por su ID.
 */
const obtenerPiezaPorId = async (id_pieza) => {
  const resultado = await pool.query(
    `SELECT id_pieza, codigo_sku, nombre, categoria_tipo,
            stock_actual, stock_minimo, precio_costo, precio_venta, fecha_registro
     FROM inventario_piezas
     WHERE id_pieza = $1`,
    [id_pieza]
  );

  if (resultado.rowCount === 0) {
    const error = new Error(`No existe una pieza con el ID: ${id_pieza}`);
    error.status = 404;
    throw error;
  }

  return resultado.rows[0];
};

/**
 * Busca piezas por nombre, SKU o categoría.
 */
const buscarPiezas = async (termino) => {
  const resultado = await pool.query(
    `SELECT id_pieza, codigo_sku, nombre, categoria_tipo,
            stock_actual, stock_minimo, precio_venta
     FROM inventario_piezas
     WHERE nombre        ILIKE $1
        OR codigo_sku    ILIKE $1
        OR categoria_tipo ILIKE $1
     ORDER BY nombre ASC`,
    [`%${termino}%`]
  );
  return resultado.rows;
};

/**
 * Crea una nueva pieza en el inventario.
 */
const crearPieza = async ({ codigo_sku, nombre, categoria_tipo, stock_actual, stock_minimo, precio_costo, precio_venta }) => {
  const existe = await pool.query(
    'SELECT 1 FROM inventario_piezas WHERE codigo_sku = $1',
    [codigo_sku]
  );

  if (existe.rowCount > 0) {
    const error = new Error(`Ya existe una pieza con el código SKU: ${codigo_sku}`);
    error.status = 409;
    throw error;
  }

  const resultado = await pool.query(
    `INSERT INTO inventario_piezas
       (codigo_sku, nombre, categoria_tipo, stock_actual, stock_minimo, precio_costo, precio_venta)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [codigo_sku, nombre, categoria_tipo, stock_actual, stock_minimo, precio_costo, precio_venta]
  );

  return resultado.rows[0];
};

/**
 * Actualiza los datos de una pieza.
 */
const actualizarPieza = async (id_pieza, { codigo_sku, nombre, categoria_tipo, stock_actual, stock_minimo, precio_costo, precio_venta }) => {
  await obtenerPiezaPorId(id_pieza);

  const resultado = await pool.query(
    `UPDATE inventario_piezas
     SET
       codigo_sku    = COALESCE($1, codigo_sku),
       nombre        = COALESCE($2, nombre),
       categoria_tipo = COALESCE($3, categoria_tipo),
       stock_actual  = COALESCE($4, stock_actual),
       stock_minimo  = COALESCE($5, stock_minimo),
       precio_costo  = COALESCE($6, precio_costo),
       precio_venta  = COALESCE($7, precio_venta)
     WHERE id_pieza = $8
     RETURNING *`,
    [
      codigo_sku    || null,
      nombre        || null,
      categoria_tipo || null,
      stock_actual  ?? null,
      stock_minimo  ?? null,
      precio_costo  ?? null,
      precio_venta  ?? null,
      id_pieza
    ]
  );

  return resultado.rows[0];
};

/**
 * Elimina una pieza solo si no tiene órdenes asociadas.
 */
const eliminarPieza = async (id_pieza) => {
  await obtenerPiezaPorId(id_pieza);

  const tieneOrdenes = await pool.query(
    'SELECT 1 FROM orden_piezas WHERE id_pieza = $1 LIMIT 1',
    [id_pieza]
  );

  if (tieneOrdenes.rowCount > 0) {
    const error = new Error('No se puede eliminar la pieza porque está asociada a Órdenes de Trabajo.');
    error.status = 409;
    throw error;
  }

  await pool.query('DELETE FROM inventario_piezas WHERE id_pieza = $1', [id_pieza]);

  return { mensaje: 'Pieza eliminada exitosamente.' };
};

/**
 * Envía alerta por email cuando el stock de una pieza baja del mínimo.
 * Se llama internamente después de descontar stock en una OT.
 */
const enviarAlertaStock = async (pieza) => {
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM,
      to:      process.env.SMTP_USER,
      subject: `⚠️ ALERTA DE STOCK: ${pieza.nombre} necesita reabastecimiento`,
      html: `
        <h2>Alerta de Stock Mínimo</h2>
        <p>La siguiente pieza ha alcanzado o superado el nivel mínimo de stock:</p>
        <table border="1" cellpadding="8" cellspacing="0">
          <tr><td><strong>SKU</strong></td><td>${pieza.codigo_sku}</td></tr>
          <tr><td><strong>Nombre</strong></td><td>${pieza.nombre}</td></tr>
          <tr><td><strong>Categoría</strong></td><td>${pieza.categoria_tipo}</td></tr>
          <tr><td><strong>Stock actual</strong></td><td style="color:red">${pieza.stock_actual}</td></tr>
          <tr><td><strong>Stock mínimo</strong></td><td>${pieza.stock_minimo}</td></tr>
        </table>
        <p>Por favor, realiza un pedido de reabastecimiento a la brevedad.</p>
      `,
    });
    console.log(`[INVENTARIO] 📧 Alerta de stock enviada para: ${pieza.nombre}`);
  } catch (err) {
    console.warn(`[INVENTARIO] ⚠️ No se pudo enviar alerta de stock: ${err.message}`);
  }
};

module.exports = {
  listarPiezas,
  listarPiezasBajoStock,
  obtenerPiezaPorId,
  buscarPiezas,
  crearPieza,
  actualizarPieza,
  eliminarPieza,
  enviarAlertaStock,
};