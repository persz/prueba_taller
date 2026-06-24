-- =============================================================================
-- SEED: Datos de prueba para desarrollo
-- Sistema de Gestión de Taller Mecánico
-- =============================================================================

-- =============================================================================
-- configuracion_taller
-- =============================================================================
INSERT INTO configuracion_taller (nombre, rnc, direccion, telefono, email)
VALUES (
    'Taller Mecánico XYZ',
    '123456789',
    'Calle Principal #1, Santo Domingo Este, RD',
    '809-000-0000',
    'taller@gmail.com'
);


-- =============================================================================
-- usuarios
-- Passwords en texto plano aquí solo para referencia.
-- En el sistema real se guardan hasheados con bcrypt.
-- admin123  → hash de bcrypt
-- empleado123 → hash de bcrypt
-- =============================================================================
INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES
    (
        'Administrador Principal',
        'admin@taller.com',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'admin'
    ),
    (
        'Juan Pérez',
        'juan@taller.com',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'empleado'
    ),
    (
        'María González',
        'maria@taller.com',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'empleado'
    );

-- Nota: El hash anterior corresponde a la password "password" en bcrypt.
-- Al arrancar el sistema debes cambiar las passwords desde el panel de admin.


-- =============================================================================
-- clientes
-- Mezcla de personas físicas y empresas
-- =============================================================================
INSERT INTO clientes (tipo_cliente, nombre_completo, cedula_rnc, telefono, email, direccion)
VALUES
    ('persona',  'Carlos Martínez',          '001-1234567-8', '809-111-2222', 'carlos@email.com',  'Calle 5 #10, Los Alcarrizos'),
    ('persona',  'Ana Rodríguez',             '001-9876543-2', '809-333-4444', 'ana@email.com',     'Av. Independencia #45, DN'),
    ('empresa',  'Transportes del Norte SRL', '130-56789-1',   '809-555-6666', 'info@transnorte.com','Autopista Duarte Km 12, Santiago'),
    ('empresa',  'Constructora Ramírez SA',   '101-34567-8',   '809-777-8888', 'admin@constructora.com', 'Av. John F. Kennedy #200, DN'),
    ('persona',  'Pedro Sánchez',             '001-5555555-5', '829-999-0000', 'pedro@email.com',   'C/ Las Flores #3, Boca Chica');


-- =============================================================================
-- inventario_piezas
-- =============================================================================
INSERT INTO inventario_piezas (codigo_sku, nombre, categoria_tipo, stock_actual, stock_minimo, precio_costo, precio_venta)
VALUES
    ('FRE-001', 'Pastilla de Freno Delantera (Par)',   'Frenos',      20,  5,   850.00,  1400.00),
    ('FRE-002', 'Disco de Freno Trasero',              'Frenos',      10,  3,  1200.00,  1900.00),
    ('FRE-003', 'Líquido de Frenos DOT4 (500ml)',      'Frenos',      30,  8,   180.00,   320.00),
    ('SUS-001', 'Amortiguador Delantero Izquierdo',    'Suspensión',   8,  2,  2500.00,  3800.00),
    ('SUS-002', 'Amortiguador Delantero Derecho',      'Suspensión',   8,  2,  2500.00,  3800.00),
    ('SUS-003', 'Buje de Suspensión Trasero',          'Suspensión',  15,  4,   350.00,   600.00),
    ('ACE-001', 'Aceite Motor 5W-30 (1L)',             'Aceites',     50, 10,   120.00,   220.00),
    ('ACE-002', 'Aceite Motor 10W-40 (1L)',            'Aceites',     40, 10,   110.00,   200.00),
    ('ACE-003', 'Aceite de Transmisión ATF (1L)',      'Aceites',     25,  6,   150.00,   280.00),
    ('FIL-001', 'Filtro de Aceite Universal',          'Filtros',     30,  8,    85.00,   160.00),
    ('FIL-002', 'Filtro de Aire Honda Civic 2018-2022','Filtros',     12,  3,   220.00,   380.00),
    ('FIL-003', 'Filtro de Combustible Universal',     'Filtros',     20,  5,   195.00,   350.00),
    ('BAT-001', 'Batería 12V 60Ah',                   'Electricidad', 6,  2,  3800.00,  5500.00),
    ('BAT-002', 'Batería 12V 45Ah',                   'Electricidad', 8,  2,  3200.00,  4800.00),
    ('ENC-001', 'Bujía NGK Estándar (c/u)',            'Electricidad',60, 12,    95.00,   180.00),
    ('COR-001', 'Correa de Distribución Universal',    'Motor',       10,  3,   850.00,  1400.00),
    ('COR-002', 'Correa Serpentina',                   'Motor',       12,  3,   650.00,  1100.00),
    ('RAD-001', 'Refrigerante Anticongelante (1L)',    'Refrigeración',35, 8,   140.00,   250.00),
    ('RAD-002', 'Tapa de Radiador Universal',          'Refrigeración',18, 4,   180.00,   320.00),
    ('NEU-001', 'Válvula de Neumático (c/u)',          'Neumáticos',  40, 10,    45.00,    90.00);