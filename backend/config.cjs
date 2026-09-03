const path = require("path");

const PORT = process.env.PORT || 3001;

// Carpeta donde viven la base de datos y la config de backups.
// En Electron la define electron/main.cjs (userData en el build empaquetado,
// carpeta backend/ en desarrollo). Si se corre el backend suelto, cae a backend/.
const DB_PATH = process.env.DB_PATH || __dirname;
const DB_NAME = "punta_en_blanko.db";
const DB_FILE = path.join(DB_PATH, DB_NAME);
const CONFIG_FILE = path.join(DB_PATH, "backup-config.json");

module.exports = { PORT, DB_PATH, DB_NAME, DB_FILE, CONFIG_FILE };
