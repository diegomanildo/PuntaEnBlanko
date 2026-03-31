/* eslint-disable no-unused-vars */
import express from "express";
import db from "../db.js";
import { capitalizarNombre } from "../utils/utils.js";

const router = express.Router();

// GET /productos
router.get("/", (req, res) => {
  db.query("SELECT * FROM productos", (err, result) => {
    if (err) {
      res.status(500).json(err);
      return;
    }

    res.json(result);
  });
});

// GET /productos/config
router.get("/config", (req, res) => {
  db.query(
    "SELECT stock_alerta FROM configuracion WHERE id = 1",
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      if (result.length === 0) {
        return res.json({ stock_alerta: 0 });
      }

      res.json(result[0]);
    },
  );
});

// PUT /productos/config
router.put("/config", (req, res) => {
  const { stock_alerta } = req.body;

  db.query(
    "UPDATE configuracion SET stock_alerta = ? WHERE id = 1",
    [stock_alerta],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: "Configuración actualizada" });
    },
  );
});

// GET /productos/stock-bajo
router.get("/stock-bajo", (req, res) => {
  db.query(
    "SELECT stock_alerta FROM configuracion WHERE id = 1",
    (err, configResult) => {
      if (err) return res.status(500).json(err);

      const stockAlerta = configResult[0].stock_alerta;

      db.query(
        "SELECT COUNT(*) as total FROM productos WHERE stock <= ? AND stock > 0",
        [stockAlerta],
        (err, stockBajoResult) => {
          if (err) return res.status(500).json(err);

          db.query(
            "SELECT COUNT(*) as total FROM productos WHERE stock = 0 AND tiene_stock = 1",
            (err, sinStockResult) => {
              if (err) return res.status(500).json(err);

              res.json({
                stockBajo: stockBajoResult[0].total,
                sinStock: sinStockResult[0].total,
              });
            },
          );
        },
      );
    },
  );
});

// GET /productos/:id
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.query("SELECT * FROM productos WHERE id = ?", [id], (err, result) => {
    if (err) {
      res.status(500).json(err);
      return;
    }

    res.json(result[0]);
  });
});

// POST /productos
router.post("/", (req, res) => {
  const { nombre, precio, stock, tiene_stock, codigo_barras, color } = req.body;

  if (!nombre || !precio || (tiene_stock && (stock === undefined || stock === null || stock === ""))) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  const nombreFormateado = capitalizarNombre(nombre);

  db.query(
    "INSERT INTO productos(nombre, precio, stock, tiene_stock, codigo_barras, color) VALUES(?, ?, ?, ?, ?, ?)",
    [
      nombreFormateado,
      precio,
      tiene_stock ? stock : 0,
      tiene_stock ? 1 : 0,
      codigo_barras,
      color ?? null,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: `Producto "${nombre}" creado` });
    },
  );
});

// PUT /productos/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock, tiene_stock, codigo_barras, color } = req.body;

  if (!nombre || !precio || (tiene_stock && (stock === undefined || stock === null || stock === ""))) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  const nombreFormateado = capitalizarNombre(nombre);

  db.query(
    "UPDATE productos SET nombre=?, precio=?, stock=?, tiene_stock=?, codigo_barras=?, color=? WHERE id=?",
    [
      nombreFormateado,
      precio,
      tiene_stock ? stock : 0,
      tiene_stock ? 1 : 0,
      codigo_barras,
      color ?? null,
      id,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json(err);
        return;
      }

      res.json({ message: `Producto "${nombre}" actualizado` });
    },
  );
});

// DELETE /productos/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT nombre FROM productos WHERE id = ?", [id], (err, result) => {
    if (err || result.length === 0)
      return res.status(404).json({ message: "Producto no encontrado" });

    const nombre = result[0].nombre;
    db.query("DELETE FROM productos WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: `Producto "${nombre}" eliminado` });
    });
  });
});

// GET /productos/barcode/:codigo
router.get("/barcode/:codigo", (req, res) => {
  const { codigo } = req.params;
  db.query(
    "SELECT * FROM productos WHERE codigo_barras = ?",
    [codigo],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length === 0)
        return res.status(404).json({ message: "Producto no encontrado" });
      res.json(result[0]);
    },
  );
});

export default router;
