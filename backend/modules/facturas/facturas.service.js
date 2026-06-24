/**
 * @file facturas.service.js
 * @description Logica de negocio para gestion de facturas.
 * Incluye generacion de NCF para cumplimiento DGII Republica Dominicana,
 * calculo de ITBIS (18%) y generacion de PDF con Puppeteer.
 */

const pool = require('../../config/db');

/**
 * Genera un Numero de Comprobante Fiscal (NCF) para la DGII.
 * Formato: B01XXXXXXXX (Factura con Valor Fiscal)
 * B01 = Facturas de credito fiscal
 * B02 = Facturas de consumo
 * El tipo depende de si el cliente es empresa o persona.
 */
const generarNCF = async (tipo_cliente) => {
  const prefijo = tipo_cliente === 'empresa' ? 'B01' : 'B02';

  const resultado = await pool.query(
    `SELECT COUNT(*) as total FROM facturas WHERE ncf LIKE $1`,
    [`${prefijo}%`]
  );

  const secuencial = parseInt(resultado.rows[0].total, 10) + 1;
  const ncf = `${prefijo}${String(secuencial).padStart(8, '0')}`;

  return { ncf, tipo_ncf: prefijo };
};

/**
 * Lista todas las facturas con datos basicos.
 */
const listarFacturas = async () => {
  const resultado = await pool.query(
    `SELECT f.id_factura, f.id_unico_ot, f.id_cliente,
            c.nombre_completo AS nombre_cliente,
            c.cedula_rnc,
            f.ncf, f.tipo_ncf,
            f.subtotal, f.itbis, f.total,
            f.estado, f.fecha_emision, f.fecha_anulacion
     FROM facturas f
     INNER JOIN clientes c ON f.id_cliente = c.id_cliente
     ORDER BY f.fecha_emision DESC`
  );
  return resultado.rows;
};

/**
 * Obtiene el detalle completo de una factura.
 */
const obtenerFacturaPorId = async (id_factura) => {
  const facturaResult = await pool.query(
    `SELECT f.*, c.nombre_completo AS nombre_cliente,
            c.cedula_rnc, c.tipo_cliente, c.telefono, c.email,
            c.direccion AS direccion_cliente
     FROM facturas f
     INNER JOIN clientes c ON f.id_cliente = c.id_cliente
     WHERE f.id_factura = $1`,
    [id_factura]
  );

  if (facturaResult.rowCount === 0) {
    const error = new Error(`No existe una factura con el ID: ${id_factura}`);
    error.status = 404;
    throw error;
  }

  // Obtener las piezas de la OT asociada
  const piezasResult = await pool.query(
    `SELECT op.cantidad_pieza, op.precio_venta, op.subtotal,
            ip.codigo_sku, ip.nombre AS nombre_pieza
     FROM orden_piezas op
     INNER JOIN inventario_piezas ip ON op.id_pieza = ip.id_pieza
     WHERE op.id_unico_ot = $1`,
    [facturaResult.rows[0].id_unico_ot]
  );

  return {
    factura: facturaResult.rows[0],
    piezas:  piezasResult.rows,
  };
};

/**
 * Genera una factura a partir de una OT completada.
 * Calcula ITBIS (18%) sobre el subtotal de piezas.
 */
const generarFactura = async (id_unico_ot) => {
  // Verificar que la OT existe y esta completada
  const otResult = await pool.query(
    `SELECT ot.*, c.tipo_cliente
     FROM ordenes_trabajo ot
     INNER JOIN clientes c ON ot.id_cliente = c.id_cliente
     WHERE ot.id_unico_ot = $1`,
    [id_unico_ot]
  );

  if (otResult.rowCount === 0) {
    const error = new Error(`No existe una Orden de Trabajo con el ID: ${id_unico_ot}`);
    error.status = 404;
    throw error;
  }

  const ot = otResult.rows[0];

  if (ot.estado !== 'Completada') {
    const error = new Error(`Solo se pueden facturar OT con estado "Completada". Estado actual: "${ot.estado}"`);
    error.status = 409;
    throw error;
  }

  // Verificar que no tenga factura ya emitida
  const facturaExiste = await pool.query(
    'SELECT 1 FROM facturas WHERE id_unico_ot = $1',
    [id_unico_ot]
  );

  if (facturaExiste.rowCount > 0) {
    const error = new Error(`La OT ${id_unico_ot} ya tiene una factura emitida.`);
    error.status = 409;
    throw error;
  }

  // Calcular totales desde las piezas de la OT
  const piezasResult = await pool.query(
    'SELECT SUM(subtotal) AS total_piezas FROM orden_piezas WHERE id_unico_ot = $1',
    [id_unico_ot]
  );

  const subtotal = parseFloat(piezasResult.rows[0].total_piezas || 0);
  const itbis    = parseFloat((subtotal * 0.18).toFixed(2));
  const total    = parseFloat((subtotal + itbis).toFixed(2));

  // Generar NCF segun tipo de cliente
  const { ncf, tipo_ncf } = await generarNCF(ot.tipo_cliente);

  const resultado = await pool.query(
    `INSERT INTO facturas (id_unico_ot, id_cliente, ncf, tipo_ncf, subtotal, itbis, total)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id_unico_ot, ot.id_cliente, ncf, tipo_ncf, subtotal, itbis, total]
  );

  return resultado.rows[0];
};

/**
 * Anula una factura emitida. Solo administradores.
 */
const anularFactura = async (id_factura, motivo_anulacion) => {
  const facturaResult = await pool.query(
    'SELECT * FROM facturas WHERE id_factura = $1',
    [id_factura]
  );

  if (facturaResult.rowCount === 0) {
    const error = new Error(`No existe una factura con el ID: ${id_factura}`);
    error.status = 404;
    throw error;
  }

  if (facturaResult.rows[0].estado === 'anulada') {
    const error = new Error('Esta factura ya fue anulada anteriormente.');
    error.status = 409;
    throw error;
  }

  const resultado = await pool.query(
    `UPDATE facturas
     SET estado           = 'anulada',
         fecha_anulacion  = NOW(),
         motivo_anulacion = $1
     WHERE id_factura = $2
     RETURNING *`,
    [motivo_anulacion, id_factura]
  );

  return resultado.rows[0];
};

module.exports = {
  listarFacturas,
  obtenerFacturaPorId,
  generarFactura,
  anularFactura,
};