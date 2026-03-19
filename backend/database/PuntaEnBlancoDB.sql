DROP DATABASE IF EXISTS punta_en_blanco;
CREATE DATABASE punta_en_blanco;

USE punta_en_blanco;

-- ── Productos ─────────────────────────────────────────────────────────────────
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    precio DECIMAL(10,2),
    tiene_stock TINYINT(1) DEFAULT 1,
    stock INT
);

INSERT INTO productos (nombre, precio, tiene_stock, stock) VALUES
    ('Lavandina Concentrada Bidon de 5 litros', 4400, 1, 20),
    ('Desodorante de piso esencia concentrada', 4100, 1, 15),
    ('Lavandina litro', 850, 1, 75),
    ('Detergente liquido ropa 1 litro', 1200, 1, 50),
    ('Jabon en polvo 5kg', 5500, 1, 25),
    ('Suavizante concentrado 1 litro', 900, 1, 40),
    ('Fregasuelos aromatico 1 litro', 1100, 1, 30),
    ('Guantes de latex x12', 1500, 1, 60),
    ('Esponjas multiuso x10', 800, 1, 100),
    ('Panios microfibra x5', 950, 1, 80),
    ('Limpiador multiuso 500ml', 700, 1, 90),
    ('Ambientador aerosol 300ml', 650, 1, 45),
    ('Cera para pisos 1 litro', 2300, 1, 20),
    ('Trapo de piso industrial', 400, 1, 75),
    ('Escoba de cerdas duras', 1200, 1, 35),
    ('Recogedor plastico', 450, 1, 50),
    ('Mopa de microfibra', 1500, 1, 40),
    ('Limpiador de vidrios 500ml', 750, 1, 60),
    ('Desinfectante en spray 500ml', 1100, 1, 55),
    ('Bolsas de basura 50 litros x20', 1300, 1, 70);

-- ── Configuracion ─────────────────────────────────────────────────────────────
CREATE TABLE configuracion (
    id INT PRIMARY KEY,
    stock_alerta INT
);

INSERT INTO configuracion (id, stock_alerta)
VALUES (1, 5);

-- ── Ventas ────────────────────────────────────────────────────────────────────
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2),
    medio_pago VARCHAR(20) DEFAULT 'efectivo',
    monto_efectivo DECIMAL(10,2) DEFAULT NULL,
    monto_transferencia DECIMAL(10,2) DEFAULT NULL
);

-- INSERT INTO ventas (fecha, total, medio_pago) VALUES
--     ('2026-03-14 10:30:00', 7250.00, 'efectivo'),
--     ('2026-03-15 14:20:00', 3200.00, 'transferencia'),
--     ('2026-03-18 09:10:00', 5600.00, 'efectivo'),
--     ('2026-03-18 15:30:00', 5600.00, 'transferencia'),
--     ('2026-03-20 17:45:00', 8900.00, 'efectivo'),
--     ('2026-03-22 11:05:00', 2100.00, 'transferencia'),
--     ('2026-03-25 16:30:00', 4750.00, 'efectivo');

-- ── Detalle ventas ────────────────────────────────────────────────────────────
CREATE TABLE detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT,
    producto_id INT,
    cantidad INT,
    precio DECIMAL(10,2),

    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ── Presupuestos ─────────────────────────────────────────────────────────────
CREATE TABLE presupuestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2),
    cliente_nombre VARCHAR(100) DEFAULT NULL,
    estado ENUM('pendiente', 'convertido') DEFAULT 'pendiente',
    venta_id INT DEFAULT NULL,
    medio_pago VARCHAR(20) DEFAULT 'efectivo',
    monto_efectivo DECIMAL(10,2) DEFAULT NULL,
    monto_transferencia DECIMAL(10,2) DEFAULT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
);

-- ── Detalle presupuestos ──────────────────────────────────────────────────────
CREATE TABLE detalle_presupuestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presupuesto_id INT,
    producto_id INT,
    cantidad INT,
    precio DECIMAL(10,2),

    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio) VALUES
--     (1, 1, 1, 4400.00),
--     (1, 3, 2,  850.00),
--     (1, 9, 1,  800.00),
--     (2, 4, 2, 1200.00),
--     (2, 6, 1,  900.00),
--     (3, 2, 1, 4100.00),
--     (3, 7, 1, 1100.00),
--     (3, 8, 1,  400.00),
--     (4, 5, 1, 5500.00),
--     (4, 3, 1,  850.00),
--     (5, 1, 2, 4400.00),
--     (5, 9, 1,  800.00),
--     (6, 11, 2,  700.00),
--     (6, 12, 1,  650.00),
--     (7, 13, 1, 2300.00),
--     (7, 14, 2,  400.00),
--     (7, 15, 1, 1200.00);