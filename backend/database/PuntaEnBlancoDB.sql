DROP DATABASE IF EXISTS punta_en_blanco;
CREATE DATABASE punta_en_blanco;

USE punta_en_blanco;

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    precio DECIMAL(10,2),
    stock INT
);

INSERT INTO productos (nombre, precio, stock) VALUES
    ('Lavandina Concentrada Bidon de 5 litros', 4400, 20),
    ('Desodorante de piso esencia concentrada', 4100, 15),
    ('Lavandina litro', 850, 75),
    ('Detergente liquido ropa 1 litro', 1200, 50),
    ('Jabon en polvo 5kg', 5500, 25),
    ('Suavizante concentrado 1 litro', 900, 40),
    ('Fregasuelos aromatico 1 litro', 1100, 30),
    ('Guantes de latex x12', 1500, 60),
    ('Esponjas multiuso x10', 800, 100),
    ('Panios microfibra x5', 950, 80),
    ('Limpiador multiuso 500ml', 700, 90),
    ('Ambientador aerosol 300ml', 650, 45),
    ('Cera para pisos 1 litro', 2300, 20),
    ('Trapo de piso industrial', 400, 75),
    ('Escoba de cerdas duras', 1200, 35),
    ('Recogedor plastico', 450, 50),
    ('Mopa de microfibra', 1500, 40),
    ('Limpiador de vidrios 500ml', 750, 60),
    ('Desinfectante en spray 500ml', 1100, 55),
    ('Bolsas de basura 50 litros x20', 1300, 70);

CREATE TABLE configuracion (
    id INT PRIMARY KEY,
    stock_alerta INT
);

INSERT INTO configuracion (id, stock_alerta)
VALUES (1, 0);

CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2)
);

CREATE TABLE detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT,
    producto_id INT,
    cantidad INT,
    precio DECIMAL(10,2),

    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);