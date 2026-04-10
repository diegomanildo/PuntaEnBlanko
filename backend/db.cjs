const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DB_PATH
  ? path.join(process.env.DB_PATH, "punta_en_blanko.db")
  : path.join(__dirname, "punta_en_blanko.db");

// --- Wrapper que imita la API de better-sqlite3 ---
// Así todas tus routes quedan exactamente igual, sin tocar nada.

function createWrapper(sqlDb) {
  // Guarda el archivo en disco
  function save() {
    const data = sqlDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }

  // Ejecuta SQL sin retorno (CREATE TABLE, PRAGMA, etc.)
  function exec(sql) {
    sqlDb.run(sql);
    save();
  }

  // Ejecuta un PRAGMA
  function pragma(statement) {
    sqlDb.run(`PRAGMA ${statement}`);
  }

  // Imita db.prepare(sql) — devuelve objeto con .all(), .get(), .run()
  function prepare(sql) {
    return {
      // SELECT múltiples filas
      all(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params.flat());
        const rows = [];
        const colNames = stmt.getColumnNames();
        while (stmt.step()) {
          const row = stmt.getAsObject();
          // sql.js devuelve bigint en algunos casos, normalizamos
          const normalized = {};
          for (const k of colNames) {
            const v = row[k];
            normalized[k] = typeof v === "bigint" ? Number(v) : v ?? null;
          }
          rows.push(normalized);
        }
        stmt.free();
        return rows;
      },

      // SELECT una sola fila
      get(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params.flat());
        if (!stmt.step()) { stmt.free(); return undefined; }
        const colNames = stmt.getColumnNames();
        const row = stmt.getAsObject();
        stmt.free();
        const normalized = {};
        for (const k of colNames) {
          const v = row[k];
          normalized[k] = typeof v === "bigint" ? Number(v) : v ?? null;
        }
        return normalized;
      },

      // INSERT / UPDATE / DELETE
      run(...params) {
        const stmt = sqlDb.prepare(sql);
        stmt.bind(params.flat());
        stmt.step();
        stmt.free();
        save();
        // Imita { changes, lastInsertRowid } de better-sqlite3
        const changes = sqlDb.getRowsModified();
        const [[lastId]] = sqlDb.exec("SELECT last_insert_rowid()")[0]?.values ?? [[0]];
        return {
          changes,
          lastInsertRowid: typeof lastId === "bigint" ? Number(lastId) : lastId,
        };
      },
    };
  }

  // Imita db.transaction(fn) — ejecuta todo en una transacción SQLite
  function transaction(fn) {
    return function (arg) {
      sqlDb.run("BEGIN");
      try {
        const result = fn(arg);
        sqlDb.run("COMMIT");
        save();
        return result;
      } catch (err) {
        sqlDb.run("ROLLBACK");
        throw err;
      }
    };
  }

  return { exec, pragma, prepare, transaction };
}

// --- Inicialización sincrónica con async IIFE ---
// Cargamos sql.js una sola vez al arrancar el servidor.

let db = null;

function getDb() {
  if (!db) throw new Error("DB no inicializada todavía. Llamá a initDb() antes.");
  return db;
}

async function initDb() {
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
    console.log("SQLite cargado desde disco:", dbPath);
  } else {
    sqlDb = new SQL.Database();
    console.log("SQLite nuevo creado en:", dbPath);
  }

  db = createWrapper(sqlDb);

  // Pragmas
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Crear tablas si no existen
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

  return db;
}

module.exports = {
  prepare: (sql) => getDb().prepare(sql),
  exec:    (sql) => getDb().exec(sql),
  pragma:  (s)   => getDb().pragma(s),
  transaction: (fn) => (...args) => getDb().transaction(fn)(...args),
  initDb,
};