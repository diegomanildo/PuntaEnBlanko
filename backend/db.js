import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH
  ? path.join(process.env.DB_PATH, "punta_en_blanko.db")
  : path.join(__dirname, "punta_en_blanko.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    precio REAL,
    tiene_stock INTEGER DEFAULT 1,
    codigo_barras TEXT DEFAULT NULL,
    color TEXT DEFAULT NULL,
    stock INTEGER
  );

  CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY,
    stock_alerta INTEGER
  );

  INSERT OR IGNORE INTO configuracion (id, stock_alerta) VALUES (1, 5);

  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    razon_social TEXT NOT NULL,
    domicilio TEXT DEFAULT NULL,
    localidad TEXT DEFAULT NULL,
    cuit TEXT NOT NULL,
    telefono TEXT DEFAULT NULL,
    mail TEXT DEFAULT NULL,
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL,
    medio_pago TEXT DEFAULT 'efectivo',
    monto_efectivo REAL DEFAULT NULL,
    monto_transferencia REAL DEFAULT NULL,
    estado TEXT DEFAULT 'normal',
    cliente_id INTEGER DEFAULT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER,
    producto_id INTEGER,
    cantidad INTEGER,
    precio REAL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total REAL,
    cliente_nombre TEXT DEFAULT NULL,
    estado TEXT DEFAULT 'pendiente',
    venta_id INTEGER DEFAULT NULL,
    medio_pago TEXT DEFAULT 'efectivo',
    monto_efectivo REAL DEFAULT NULL,
    monto_transferencia REAL DEFAULT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS detalle_presupuestos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    presupuesto_id INTEGER,
    producto_id INTEGER,
    cantidad INTEGER,
    precio REAL,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
  );
`);

console.log("SQLite conectado:", dbPath);

export default db;