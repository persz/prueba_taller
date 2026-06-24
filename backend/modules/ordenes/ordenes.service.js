
/**
 * @file ordenes.service.js
 * @description Logica de negocio para Ordenes de Trabajo.
 * Incluye generacion de ID unico, flujo transaccional para agregar piezas
 * y control de permisos para eliminar OT propia o como admin.
 */

const pool               = require('../../config/db');
const { enviarAlertaStock } = require('../inventario/inventario.service');

/**
 * Genera un ID unico para la OT con verificacion de colision en BD.
 * Formato: OT-YYYY-XXXX
 */
const generarIdUnicoOT = async () => {
  const anio = new Date().getFullYear();
  let idUnico;
  let existe = true;

  while (existe) {
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    idUnico = `OT-${anio}-${aleatorio}`;
    const check = await pool.query(
      'SELECT 1 FROM ordenes_trabajo WHERE id_unico_ot = $1',
      [idUnico]
    );
    existe = check.rowCount > 0;
  }

  return idUnico;
};

/**
 * Lista todas las ordenes de trabajo.
 * Admin ve todas, empleado solo las suyas.
 */
const listarOrdenes = async (usuario) => {
  let query;
  let params;

  if (usuario.rol === 'admin') {
    query = `
      SELECT ot.id_unico_ot, ot.nombre_cliente, ot.cedula_rnc_cliente,
             ot.tipo_cliente, ot.vin, ot.placa, ot.marca, ot.modelo,
             ot.anio, ot.estado, ot.mecanico_asignado,
             ot.fecha_ingreso, ot.fecha_entrega,
             u.nombre AS creado_por
      FROM ordenes_trabajo ot
      INNER JOIN usuarios u ON ot.id_usuario_creador = u.id_usuario
      ORDER BY ot.fecha_ingreso DESC`;
    params = [];
  } else {
    query = `
      SELECT ot.id_unico_ot, ot.nombre_cliente, ot.cedula_rnc_cliente,
             ot.tipo_cliente, ot.vin, ot.placa, ot.marca, ot.modelo,
             ot.anio, ot.estado, ot.mecanico_asignado,
             ot.fecha_ingreso, ot.fecha_entrega,
             u.nombre AS creado_por
      FROM ordenes_trabajo ot
      INNER JOIN usuarios u ON ot.id_usuario_creador = u.id_usuario
      WHERE ot.id_usuario_creador = $1
      ORDER BY ot.fecha_ingreso DESC`;
    params = [usuario.id_usuario];
  }

  const resultado = await pool.query(query, params);
  return resultado.rows;
};

/**
 * Obtiene el detalle completo de una OT incluyendo las piezas asociadas.
 */
const obtenerOrdenPorId = async (id_unico_ot) => {
  const ordenResult = await pool.query(
    'SELECT * FROM ordenes_trabajo WHERE id_unico_ot = $1',
    [id_unico_ot]
  );

  if (ordenResult.rowCount === 0) {
    const error = new Error(`No existe una Orden de Trabajo con el ID: ${id_unico_ot}`);
    error.status = 404;
    throw error;
  }

  const piezasResult = await pool.query(
    `SELECT op.id_orden_pieza, op.id_pieza, ip.codigo_sku,
            ip.nombre AS nombre_pieza, ip.categoria_tipo,
            op.cantidad_pieza, op.precio_venta, op.subtotal
     FROM orden_piezas op
     INNER JOIN inventario_piezas ip ON op.id_pieza = ip.id_pieza
     WHERE op.id_unico_ot = $1
     ORDER BY op.id_orden_pieza ASC`,
    [id_unico_ot]
  );

  return {
    orden:  ordenResult.rows[0],
    piezas: piezasResult.rows,
  };
};

/**
 * Crea una nueva Orden de Trabajo.
 * Los datos del cliente y vehiculo se congelan al momento de crear la OT.
 */
const crearOrden = async ({
  id_cliente,
  vin, placa, marca, modelo, anio,
  descripcion_trabajo,
  mecanico_asignado,
  id_usuario_creador,
}) => {
  // Verificar que el cliente existe y obtener sus datos para congelarlos
  const clienteResult = await pool.query(
    'SELECT nombre_completo, cedula_rnc, tipo_cliente FROM clientes WHERE id_cliente = $1',
    [id_cliente]
  );

  if (clienteResult.rowCount === 0) {
    const error = new Error(`No existe un cliente con el ID: ${id_cliente}`);
    error.status = 404;
    throw error;
  }

  const cliente  = clienteResult.rows[0];
  const idUnicoOT = await generarIdUnicoOT();

  const resultado = await pool.query(
    `INSERT INTO ordenes_trabajo (
       id_unico_ot, id_cliente,
       nombre_cliente, cedula_rnc_cliente, tipo_cliente,
       vin, placa, marca, modelo, anio,
       descripcion_trabajo, mecanico_asignado, id_usuario_creador
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      idUnicoOT, id_cliente,
      cliente.nombre_completo, cliente.cedula_rnc, cliente.tipo_cliente,
      vin.toUpperCase(), placa.toUpperCase(), marca, modelo, anio,
      descripcion_trabajo, mecanico_asignado || null, id_usuario_creador,
    ]
  );

  return resultado.rows[0];
};

/**
 * Agrega una pieza a una OT existente mediante un flujo transaccional de 3 pasos:
 * 1. Valida existencia de la pieza y disponibilidad de stock.
 * 2. Inserta en orden_piezas con precio congelado.
 * 3. Descuenta el stock en inventario_piezas.
 * Si cualquier paso falla se ejecuta ROLLBACK automatico.
 */
const agregarPiezaAOrden = async ({ id_ot, id_pieza, cantidad }) => {
  const cantidadNum = parseInt(cantidad, 10);

  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    const error = new Error('La cantidad debe ser un numero entero positivo mayor a 0.');
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // PASO 1: Verificar existencia de la OT
    const otResult = await client.query(
      'SELECT 1 FROM ordenes_trabajo WHERE id_unico_ot = $1',
      [id_ot]
    );

    if (otResult.rowCount === 0) {
      await client.query('ROLLBACK');
      const error = new Error(`No existe una Orden de Trabajo con el ID: ${id_ot}`);
      error.status = 404;
      throw error;
    }

    // PASO 2: Verificar existencia de la pieza y stock disponible
    const piezaResult = await client.query(
      `SELECT id_pieza, nombre, codigo_sku, categoria_tipo,
              stock_actual, stock_minimo, precio_venta
       FROM inventario_piezas
       WHERE id_pieza = $1`,
      [id_pieza]
    );

    if (piezaResult.rowCount === 0) {
      await client.query('ROLLBACK');
      const error = new Error(`No existe una pieza con el ID: ${id_pieza}`);
      error.status = 404;
      throw error;
    }

    const pieza = piezaResult.rows[0];

    if (pieza.stock_actual < cantidadNum) {
      await client.query('ROLLBACK');
      const error = new Error(
        `Stock insuficiente para "${pieza.nombre}". Stock disponible: ${pieza.stock_actual}, cantidad solicitada: ${cantidadNum}.`
      );
      error.status = 409;
      throw error;
    }

    // PASO 3: Calcular subtotal e insertar en orden_piezas
    const precioVenta = parseFloat(pieza.precio_venta);
    const subtotal    = precioVenta * cantidadNum;

    const insertResult = await client.query(
      `INSERT INTO orden_piezas (id_unico_ot, id_pieza, cantidad_pieza, precio_venta, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id_ot, id_pieza, cantidadNum, precioVenta, subtotal]
    );

    // PASO 4: Descontar stock en inventario_piezas
    await client.query(
      `UPDATE inventario_piezas
       SET stock_actual = stock_actual - $1
       WHERE id_pieza = $2`,
      [cantidadNum, id_pieza]
    );

    await client.query('COMMIT');

    // Verificar alerta de stock post-transaccion
    const nuevoStock   = pieza.stock_actual - cantidadNum;
    const alertaActiva = nuevoStock <= pieza.stock_minimo;

    if (alertaActiva) {
      // Enviar alerta de forma asincrona sin bloquear la respuesta
      enviarAlertaStock({ ...pieza, stock_actual: nuevoStock }).catch(() => {});
    }

    return {
      orden_pieza:  insertResult.rows[0],
      alerta_stock: alertaActiva
        ? {
            activa:               true,
            mensaje:              `ALERTA: El stock de "${pieza.nombre}" (${nuevoStock} unidades) ha alcanzado el nivel minimo (${pieza.stock_minimo}).`,
            stock_actual_restante: nuevoStock,
            stock_minimo:          pieza.stock_minimo,
          }
        : { activa: false },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza el estado de una OT.
 * Si el estado es "Completada" se registra la fecha_entrega automaticamente.
 */
const actualizarEstadoOrden = async (id_unico_ot, estado) => {
  const estadosValidos = ['Pendiente', 'En Proceso', 'Completada', 'Cancelada'];

  if (!estadosValidos.includes(estado)) {
    const error = new Error(`Estado invalido. Debe ser uno de: ${estadosValidos.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const resultado = await pool.query(
    `UPDATE ordenes_trabajo
     SET estado        = $1::VARCHAR,
         fecha_entrega = CASE WHEN $1::VARCHAR = 'Completada' THEN NOW() ELSE fecha_entrega END
     WHERE id_unico_ot = $2
     RETURNING id_unico_ot, estado, fecha_entrega`,
    [estado, id_unico_ot]
  );

  if (resultado.rowCount === 0) {
    const error = new Error(`No existe una Orden de Trabajo con el ID: ${id_unico_ot}`);
    error.status = 404;
    throw error;
  }

  return resultado.rows[0];
};

/**
 * Elimina una OT.
 * Admin puede eliminar cualquier OT.
 * Empleado solo puede eliminar las OT que el mismo creo.
 */
const eliminarOrden = async (id_unico_ot, usuario) => {
  const ordenResult = await pool.query(
    'SELECT id_usuario_creador, estado FROM ordenes_trabajo WHERE id_unico_ot = $1',
    [id_unico_ot]
  );

  if (ordenResult.rowCount === 0) {
    const error = new Error(`No existe una Orden de Trabajo con el ID: ${id_unico_ot}`);
    error.status = 404;
    throw error;
  }

  const orden = ordenResult.rows[0];

  // Verificar permiso: empleado solo puede eliminar sus propias OT
  if (usuario.rol === 'empleado' && orden.id_usuario_creador !== usuario.id_usuario) {
    const error = new Error('No tienes permiso para eliminar esta Orden de Trabajo.');
    error.status = 403;
    throw error;
  }

  // No se puede eliminar una OT que ya tiene factura
  const tieneFactura = await pool.query(
    'SELECT 1 FROM facturas WHERE id_unico_ot = $1 LIMIT 1',
    [id_unico_ot]
  );

  if (tieneFactura.rowCount > 0) {
    const error = new Error('No se puede eliminar una OT que ya tiene una factura emitida.');
    error.status = 409;
    throw error;
  }

  await pool.query('DELETE FROM ordenes_trabajo WHERE id_unico_ot = $1', [id_unico_ot]);

  return { mensaje: `Orden de Trabajo ${id_unico_ot} eliminada exitosamente.` };
};

module.exports = {
  listarOrdenes,
  obtenerOrdenPorId,
  crearOrden,
  agregarPiezaAOrden,
  actualizarEstadoOrden,
  eliminarOrden,
};