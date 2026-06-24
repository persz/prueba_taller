-- =============================================================================
-- SISTEMA DE GESTIÓN DE TALLER MECÁNICO
-- Schema completo de base de datos
-- PostgreSQL 16
-- =============================================================================

-- Limpiar schema si existe (útil para reinicios en desarrollo)
DROP TABLE IF EXISTS facturas        CASCADE;
DROP TABLE IF EXISTS orden_piezas    CASCADE;
DROP TABLE IF EXISTS ordenes_trabajo CASCADE;
DROP TABLE IF EXISTS inventario_piezas CASCADE;
DROP TABLE IF EXISTS vehiculos_consulta CASCADE;
DROP TABLE IF EXISTS clientes        CASCADE;
DROP TABLE IF EXISTS usuarios        CASCADE;
DROP TABLE IF EXISTS configuracion_taller CASCADE;


-- =============================================================================
-- TABLA: configuracion_taller
-- Datos del taller para facturas y DGII. Solo 1 fila.
-- =============================================================================
CREATE TABLE configuracion_taller (
    id               SERIAL         PRIMARY KEY,
    nombre           VARCHAR(200)   NOT NULL,
    rnc              VARCHAR(20)    NOT NULL,
    direccion        TEXT           NOT NULL,
    telefono         VARCHAR(20)    NOT NULL,
    email            VARCHAR(150),
    logo_url         TEXT,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- TABLA: usuarios
-- Empleados y administradores del sistema.
-- =============================================================================
CREATE TABLE usuarios (
    id_usuario       SERIAL         PRIMARY KEY,
    nombre           VARCHAR(150)   NOT NULL,
    email            VARCHAR(150)   NOT NULL UNIQUE,
    password_hash    TEXT           NOT NULL,
    rol              VARCHAR(20)    NOT NULL DEFAULT 'empleado',
    activo           BOOLEAN        NOT NULL DEFAULT TRUE,
    fecha_registro   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_rol CHECK (rol IN ('admin', 'empleado'))
);


-- =============================================================================
-- TABLA: clientes
-- Personas físicas o empresas (personas jurídicas).
-- =============================================================================
CREATE TABLE clientes (
    id_cliente       SERIAL         PRIMARY KEY,
    tipo_cliente     VARCHAR(20)    NOT NULL DEFAULT 'persona',
    nombre_completo  VARCHAR(200)   NOT NULL,
    cedula_rnc       VARCHAR(20)    NOT NULL UNIQUE,
    telefono         VARCHAR(20)    NOT NULL,
    email            VARCHAR(150),
    direccion        TEXT,
    fecha_registro   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tipo_cliente CHECK (tipo_cliente IN ('persona', 'empresa'))
);


-- =============================================================================
-- TABLA: inventario_piezas
-- Catálogo de repuestos con stock y precios.
-- =============================================================================
CREATE TABLE inventario_piezas (
    id_pieza         SERIAL          PRIMARY KEY,
    codigo_sku       VARCHAR(50)     NOT NULL UNIQUE,
    nombre           VARCHAR(200)    NOT NULL,
    categoria_tipo   VARCHAR(100)    NOT NULL,
    stock_actual     INT             NOT NULL DEFAULT 0,
    stock_minimo     INT             NOT NULL DEFAULT 5,
    precio_costo     NUMERIC(10,2)   NOT NULL,
    precio_venta     NUMERIC(10,2)   NOT NULL,
    fecha_registro   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_stock_no_negativo    CHECK (stock_actual >= 0),
    CONSTRAINT chk_precio_costo_valido  CHECK (precio_costo > 0),
    CONSTRAINT chk_precio_venta_valido  CHECK (precio_venta > 0),
    CONSTRAINT chk_margen_precio        CHECK (precio_venta >= precio_costo)
);


-- =============================================================================
-- TABLA: ordenes_trabajo
-- Registro maestro de cada trabajo. Los datos del vehículo y cliente
-- se congelan al momento de crear la OT para preservar el historial.
-- =============================================================================
CREATE TABLE ordenes_trabajo (
    id_unico_ot          VARCHAR(20)    PRIMARY KEY,
    id_cliente           INT            NOT NULL,

    -- Datos del cliente congelados al momento de crear la OT
    nombre_cliente       VARCHAR(200)   NOT NULL,
    cedula_rnc_cliente   VARCHAR(20)    NOT NULL,
    tipo_cliente         VARCHAR(20)    NOT NULL,

    -- Datos del vehículo (traídos de la API NHTSA + ingresados manualmente)
    vin                  VARCHAR(17)    NOT NULL,
    placa                VARCHAR(20)    NOT NULL,
    marca                VARCHAR(100)   NOT NULL,
    modelo               VARCHAR(100)   NOT NULL,
    anio                 INT            NOT NULL,

    -- Datos del trabajo
    descripcion_trabajo  TEXT           NOT NULL,
    mecanico_asignado    VARCHAR(150),
    id_usuario_creador   INT            NOT NULL,
    estado               VARCHAR(20)    NOT NULL DEFAULT 'Pendiente',
    fecha_ingreso        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    fecha_entrega        TIMESTAMPTZ,

    CONSTRAINT fk_ot_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ot_usuario
        FOREIGN KEY (id_usuario_creador)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT chk_estado_ot CHECK (
        estado IN ('Pendiente', 'En Proceso', 'Completada', 'Cancelada')
    )
);


-- =============================================================================
-- TABLA: orden_piezas
-- Piezas consumidas por cada OT. Precio congelado históricamente.
-- =============================================================================
CREATE TABLE orden_piezas (
    id_orden_pieza   SERIAL          PRIMARY KEY,
    id_unico_ot      VARCHAR(20)     NOT NULL,
    id_pieza         INT             NOT NULL,
    cantidad_pieza   INT             NOT NULL,
    precio_venta     NUMERIC(10,2)   NOT NULL,
    subtotal         NUMERIC(10,2)   NOT NULL,

    CONSTRAINT fk_op_ot
        FOREIGN KEY (id_unico_ot)
        REFERENCES ordenes_trabajo(id_unico_ot)
        ON DELETE CASCADE,

    CONSTRAINT fk_op_pieza
        FOREIGN KEY (id_pieza)
        REFERENCES inventario_piezas(id_pieza)
        ON DELETE RESTRICT,

    CONSTRAINT chk_cantidad_positiva CHECK (cantidad_pieza > 0),
    CONSTRAINT chk_subtotal_positivo CHECK (subtotal > 0)
);


-- =============================================================================
-- TABLA: facturas
-- Una factura se genera desde una OT completada.
-- =============================================================================
CREATE TABLE facturas (
    id_factura       SERIAL          PRIMARY KEY,
    id_unico_ot      VARCHAR(20)     NOT NULL UNIQUE,
    id_cliente       INT             NOT NULL,

    -- Datos fiscales DGII
    ncf              VARCHAR(20),
    tipo_ncf         VARCHAR(10),

    -- Montos
    subtotal         NUMERIC(10,2)   NOT NULL,
    itbis            NUMERIC(10,2)   NOT NULL DEFAULT 0,
    total            NUMERIC(10,2)   NOT NULL,

    -- Estado
    estado           VARCHAR(20)     NOT NULL DEFAULT 'emitida',
    fecha_emision    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    fecha_anulacion  TIMESTAMPTZ,
    motivo_anulacion TEXT,

    CONSTRAINT fk_factura_ot
        FOREIGN KEY (id_unico_ot)
        REFERENCES ordenes_trabajo(id_unico_ot)
        ON DELETE RESTRICT,

    CONSTRAINT fk_factura_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON DELETE RESTRICT,

    CONSTRAINT chk_estado_factura CHECK (
        estado IN ('emitida', 'anulada')
    ),
    CONSTRAINT chk_total_positivo CHECK (total > 0)
);


-- =============================================================================
-- ÍNDICES para rendimiento en consultas frecuentes
-- =============================================================================
CREATE INDEX idx_ordenes_estado        ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_id_cliente    ON ordenes_trabajo(id_cliente);
CREATE INDEX idx_ordenes_id_creador    ON ordenes_trabajo(id_usuario_creador);
CREATE INDEX idx_ordenes_vin           ON ordenes_trabajo(vin);
CREATE INDEX idx_op_id_ot             ON orden_piezas(id_unico_ot);
CREATE INDEX idx_op_id_pieza          ON orden_piezas(id_pieza);
CREATE INDEX idx_inventario_sku       ON inventario_piezas(codigo_sku);
CREATE INDEX idx_clientes_cedula_rnc  ON clientes(cedula_rnc);
CREATE INDEX idx_facturas_id_ot       ON facturas(id_unico_ot);