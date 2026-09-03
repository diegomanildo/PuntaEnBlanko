const express = require("express");
const fs = require("fs");
const path = require("path");
const { DB_FILE, DB_NAME, CONFIG_FILE } = require("../config.cjs");

const router = express.Router();

function leerConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      return {
        destino: config.destino ?? null,
        automatico: config.automatico,
        maxBackups: config.maxBackups,
        ultimoBackup: config.ultimoBackup ?? null,
      };
    }
  } catch (err) {
    console.error("Error leyendo config de backups:", err);
  }
  return { destino: null, automatico: null, maxBackups: null, ultimoBackup: null };
}

function limpiarBackupsAntiguos(destino, maxBackups) {
  if (!maxBackups || maxBackups <= 0) return;

  const entradas = fs.readdirSync(destino, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("backup_"))
    .map((e) => {
      const rutaCompleta = path.join(destino, e.name);
      const stats = fs.statSync(rutaCompleta);
      return { nombre: e.name, ruta: rutaCompleta, mtime: stats.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime); // más reciente primero

  if (entradas.length <= maxBackups) return;

  const sobrantes = entradas.slice(maxBackups);
  for (const carpeta of sobrantes) {
    fs.rmSync(carpeta.ruta, { recursive: true, force: true });
  }
}

function generarNombreCarpeta() {
  const f = new Date();
  const yyyy = f.getFullYear();
  const mm = String(f.getMonth() + 1).padStart(2, "0");
  const dd = String(f.getDate()).padStart(2, "0");
  const hh = String(f.getHours()).padStart(2, "0");
  const min = String(f.getMinutes()).padStart(2, "0");
  return `backup_${dd}-${mm}-${yyyy}_${hh}hs${min}mins`;
}

function ejecutarBackup(destino, maxBackups) {
  if (!fs.existsSync(DB_FILE)) {
    throw new Error("No se encontró la base de datos");
  }
  if (!destino) {
    throw new Error("No se configuró una carpeta de destino");
  }
  if (!fs.existsSync(destino)) {
    fs.mkdirSync(destino, { recursive: true });
  }

  const nombreCarpeta = generarNombreCarpeta();
  const carpetaBackup = path.join(destino, nombreCarpeta);
  fs.mkdirSync(carpetaBackup, { recursive: true });

  const rutaArchivo = path.join(carpetaBackup, DB_NAME);
  fs.copyFileSync(DB_FILE, rutaArchivo);

  limpiarBackupsAntiguos(destino, maxBackups);

  const config = leerConfig();
  config.ultimoBackup = new Date().toISOString();
  guardarConfig(config);

  return { carpeta: nombreCarpeta, ruta: carpetaBackup };
}

function guardarConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// GET /backups/db-size
router.get("/db-size", (req, res) => {
  if (!fs.existsSync(DB_FILE)) {
    return res.json({ tamano: 0 });
  }
  const stats = fs.statSync(DB_FILE);
  res.json({ tamano: stats.size });
});

// GET /backups/config
router.get("/config", (req, res) => {
  const config = leerConfig();
  res.json(config);
});

// PUT /backups/config
router.put("/config", (req, res) => {
  const actual = leerConfig();
  const nuevo = {
    destino: req.body.destino !== undefined ? req.body.destino : actual.destino,
    automatico:
      req.body.automatico !== undefined ? req.body.automatico : actual.automatico,
    maxBackups:
      req.body.maxBackups !== undefined ? req.body.maxBackups : actual.maxBackups,
    ultimoBackup:
      req.body.ultimoBackup !== undefined
        ? req.body.ultimoBackup
        : actual.ultimoBackup,
  };
  guardarConfig(nuevo);
  res.json(nuevo);
});

// POST /backups
router.post("/", (req, res) => {
  const config = leerConfig();
  const destino = req.body?.destino || config.destino;
  const resultado = ejecutarBackup(destino, config.maxBackups);
  res.json({ success: true, ...resultado });
});

// POST /backups/auto
router.post("/auto", (req, res) => {
  const config = leerConfig();
  if (!config.automatico) {
    return res.json({ ejecutado: false });
  }
  const resultado = ejecutarBackup(config.destino, config.maxBackups);
  res.json({ ejecutado: true, ...resultado });
});

module.exports = router;