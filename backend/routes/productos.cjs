const express = require("express");
const db = require("../db.cjs");
const { capitalizarNombre } = require("../utils/utils.cjs");

const router = express.Router();

// GET /productos
router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM productos").all();
  res.json(rows);
});

// GET /productos/config
router.get("/config", (req, res) => {
  const row = db.prepare("SELECT stock_alerta FROM configuracion WHERE id = 1").get();
  res.json(row ?? { stock_alerta: 0 });
});

// PUT /productos/config
router.put("/config", (req, res) => {
  const { stock_alerta } = req.body;
  db.prepare("UPDATE configuracion SET stock_alerta = ? WHERE id = 1").run(stock_alerta);
  res.json({ message: "Configuración actualizada" });
});

// GET /productos/stock-bajo
router.get("/stock-bajo", (req, res) => {
  const config = db.prepare("SELECT stock_alerta FROM configuracion WHERE id = 1").get();
  const stockAlerta = config.stock_alerta;

  const { total: stockBajo } = db
    .prepare("SELECT COUNT(*) as total FROM productos WHERE stock <= ? AND stock > 0")
    .get(stockAlerta);

  const { total: sinStock } = db
    .prepare("SELECT COUNT(*) as total FROM productos WHERE stock = 0 AND tiene_stock = 1")
    .get();

  res.json({ stockBajo, sinStock });
});

// GET /productos/barcode/:codigo
router.get("/barcode/:codigo", (req, res) => {
  const row = db
    .prepare("SELECT * FROM productos WHERE codigo_barras = ?")
    .get(req.params.codigo);
  if (!row) return res.status(404).json({ message: "Producto no encontrado" });
  res.json(row);
});

// GET /productos/:id
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM productos WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ message: "Producto no encontrado" });
  res.json(row);
});

// POST /productos
router.post("/", (req, res) => {
  const { nombre, precio, stock, tiene_stock, codigo_barras, color } = req.body;

  if (!nombre || !precio || (tiene_stock && (stock === undefined || stock === null || stock === ""))) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  db.prepare(
    "INSERT INTO productos (nombre, precio, stock, tiene_stock, codigo_barras, color) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    capitalizarNombre(nombre),
    precio,
    tiene_stock ? stock : 0,
    tiene_stock ? 1 : 0,
    codigo_barras ?? null,
    color ?? null
  );
  res.json({ message: `Producto "${nombre}" creado` });
});

// PUT /productos/:id
router.put("/:id", (req, res) => {
  const { nombre, precio, stock, tiene_stock, codigo_barras, color } = req.body;
  const { id } = req.params;

  if (!nombre || !precio || (tiene_stock && (stock === undefined || stock === null || stock === ""))) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  db.prepare(
    "UPDATE productos SET nombre=?, precio=?, stock=?, tiene_stock=?, codigo_barras=?, color=? WHERE id=?"
  ).run(
    capitalizarNombre(nombre),
    precio,
    tiene_stock ? stock : 0,
    tiene_stock ? 1 : 0,
    codigo_barras ?? null,
    color ?? null,
    id
  );
  res.json({ message: `Producto "${nombre}" actualizado` });
});

// DELETE /productos/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const row = db.prepare("SELECT nombre FROM productos WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ message: "Producto no encontrado" });
  db.prepare("DELETE FROM productos WHERE id = ?").run(id);
  res.json({ message: `Producto "${row.nombre}" eliminado` });
});

module.exports = router;
