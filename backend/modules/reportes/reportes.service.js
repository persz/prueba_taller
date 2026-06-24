/**
 * @file reportes.service.js
 * @description Queries agregadas para el dashboard y reportes del negocio.
 * Solo accesible por administradores.
 */

const pool = require('../../config/db');

/**
 * Resumen general del dashboard.
 * Retorna totales de OT, facturacion, clientes y alertas de stock.
 */
const getDashboard = async () => {
  const [ordenes, facturacion, clientes, stockCritico] = await Promise.all([
    // Total de OT por estado
    pool.query(`
      SELECT estado, COUNT(*) AS total
      FROM ordenes_trabajo
      GROUP BY estado
      ORDER BY estado ASC
    `),

    // Facturacion del mes actual
    pool.query(`
      SELECT
        COUNT(*)                          AS total_facturas,
        COALESCE(SUM(subtotal), 0)        AS total_subtotal,
        COALESCE(SUM(itbis), 0)           AS total_itbis,
        COALESCE(SUM(total), 0)           AS total_facturado
      FROM facturas
      WHERE estado = 'emitida'
        AND DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW())
    `),

    // Total de clientes por tipo
    pool.query(`
      SELECT tipo_cliente, COUNT(*) AS total
      FROM clientes
      GROUP BY tipo_cliente
    `),

    // Piezas con stock critico
    pool.query(`
      SELECT COUNT(*) AS total
      FROM inventario_piezas
      WHERE stock_actual <= stock_minimo
    `),
  ]);

  return {
    ordenes_por_estado: ordenes.rows,
    facturacion_mes:    facturacion.rows[0],
    clientes_por_tipo:  clientes.rows,
    piezas_stock_critico: parseInt(stockCritico.rows[0].total, 10),
  };
};

/**
 * Reporte de ingresos por periodo.
 * @param {string} desde - Fecha inicio (YYYY-MM-DD)
 * @param {string} hasta - Fecha fin (YYYY-MM-DD)
 */
const getReporteIngresos = async (desde, hasta) => {
  if (!desde || !hasta) {
    const error = new Error('Los parametros "desde" y "hasta" son obligatorios.');
    error.status = 400;
    throw error;
  }

  const resultado = await pool.query(`
    SELECT
      DATE(f.fecha_emision)             AS fecha,
      COUNT(f.id_factura)               AS total_facturas,
      COALESCE(SUM(f.subtotal), 0)      AS subtotal,
      COALESCE(SUM(f.itbis), 0)         AS itbis,
      COALESCE(SUM(f.total), 0)         AS total
    FROM facturas f
    WHERE f.estado = 'emitida'
      AND f.fecha_emision BETWEEN $1 AND $2
    GROUP BY DATE(f.fecha_emision)
    ORDER BY fecha ASC`,
    [desde, hasta]
  );

  const totales = await pool.query(`
    SELECT
      COUNT(id_factura)            AS total_facturas,
      COALESCE(SUM(subtotal), 0)   AS total_subtotal,
      COALESCE(SUM(itbis), 0)      AS total_itbis,
      COALESCE(SUM(total), 0)      AS total_facturado
    FROM facturas
    WHERE estado = 'emitida'
      AND fecha_emision BETWEEN $1 AND $2`,
    [desde, hasta]
  );

  return {
    periodo: { desde, hasta },
    detalle_por_dia: resultado.rows,
    totales: totales.rows[0],
  };
};

/**
 * Reporte de piezas mas utilizadas en OT.
 */
const getReportePiezasMasUsadas = async () => {
  const resultado = await pool.query(`
    SELECT
      ip.codigo_sku,
      ip.nombre,
      ip.categoria_tipo,
      SUM(op.cantidad_pieza)  AS total_unidades_usadas,
      SUM(op.subtotal)        AS total_facturado,
      COUNT(op.id_orden_pieza) AS veces_usado
    FROM orden_piezas op
    INNER JOIN inventario_piezas ip ON op.id_pieza = ip.id_pieza
    GROUP BY ip.id_pieza, ip.codigo_sku, ip.nombre, ip.categoria_tipo
    ORDER BY total_unidades_usadas DESC
    LIMIT 10
  `);

  return resultado.rows;
};

/**
 * Reporte de OT por mecanico.
 */
const getReportePorMecanico = async () => {
  const resultado = await pool.query(`
    SELECT
      mecanico_asignado,
      COUNT(*)                                          AS total_ot,
      COUNT(*) FILTER (WHERE estado = 'Completada')     AS completadas,
      COUNT(*) FILTER (WHERE estado = 'Pendiente')      AS pendientes,
      COUNT(*) FILTER (WHERE estado = 'En Proceso')     AS en_proceso,
      COUNT(*) FILTER (WHERE estado = 'Cancelada')      AS canceladas
    FROM ordenes_trabajo
    WHERE mecanico_asignado IS NOT NULL
    GROUP BY mecanico_asignado
    ORDER BY total_ot DESC
  `);

  return resultado.rows;
};

module.exports = {
  getDashboard,
  getReporteIngresos,
  getReportePiezasMasUsadas,
  getReportePorMecanico,
};