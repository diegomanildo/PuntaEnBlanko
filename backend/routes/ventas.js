import express from "express";
import db from "../db.js";

const router = express.Router();

// POST /ventas
router.post("/", (req, res) => {
  const { productos, total, medio_pago, monto_efectivo, monto_transferencia, cliente_id } = req.body;

  try {
    const ventaResult = db.prepare(
      "INSERT INTO ventas (total, medio_pago, monto_efectivo, monto_transferencia, cliente_id) VALUES (?, ?, ?, ?, ?)"
    ).run(total, medio_pago, monto_efectivo ?? null, monto_transferencia ?? null, cliente_id ?? null);

    const ventaId = ventaResult.lastInsertRowid;

    const insertDetalle = db.prepare(
      "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)"
    );
    const actualizarStock = db.prepare(
      "UPDATE productos SET stock = stock - ? WHERE id = ?"
    );

    const insertarTodo = db.transaction((productos) => {
      for (const p of productos) {
        insertDetalle.run(ventaId, p.id, p.cantidad, p.precio);
        actualizarStock.run(p.cantidad, p.id);
      }
    });

    insertarTodo(productos);

    res.json({ success: true, id: ventaId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear venta" });
  }
});

// GET /ventas/hoy
router.get("/hoy", (req, res) => {
  try {
    const ventas = db.prepare(`
      SELECT v.*, c.razon_social AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE DATE(v.fecha) = DATE('now', 'localtime')
      AND v.estado = 'normal'
      ORDER BY v.fecha DESC
    `).all();

    const { total } = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE DATE(fecha) = DATE('now', 'localtime')
      AND estado = 'normal'
    `).get();

    res.json({ ventas, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /ventas/mes
router.get("/mes", (req, res) => {
  try {
    const porDia = db.prepare(`
      SELECT strftime('%Y-%m-%d', fecha) as dia, COUNT(*) as cantidad, SUM(total) as total
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now', 'localtime')
      AND estado = 'normal'
      GROUP BY strftime('%Y-%m-%d', fecha)
      ORDER BY dia ASC
    `).all();

    const resumen = db.prepare(`
      SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now', 'localtime')
      AND estado = 'normal'
    `).get();

    const topProductos = db.prepare(`
      SELECT p.nombre, SUM(dv.cantidad) as total_vendido
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      JOIN ventas v ON dv.venta_id = v.id
      WHERE strftime('%Y-%m', v.fecha) = strftime('%Y-%m', 'now', 'localtime')
      AND v.estado = 'normal'
      GROUP BY p.nombre
      ORDER BY total_vendido DESC
      LIMIT 3
    `).all();

    res.json({
      porDia,
      total: resumen.total || 0,
      cantidadVentas: resumen.cantidad || 0,
      topProductos,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /ventas/dia/:fecha
router.get("/dia/:fecha", (req, res) => {
  const { fecha } = req.params;
  try {
    const ventas = db.prepare(`
      SELECT v.*, c.razon_social AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE DATE(v.fecha) = ?
      AND v.estado = 'normal'
      ORDER BY v.fecha DESC
    `).all(fecha);

    const { total } = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM ventas
      WHERE DATE(fecha) = ?
      AND estado = 'normal'
    `).get(fecha);

    res.json({ ventas, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /ventas/historial
router.get("/historial", (req, res) => {
  try {
    const ventas = db.prepare(`
      SELECT v.*, c.razon_social AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.fecha DESC
      LIMIT 50
    `).all();
    res.json(ventas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /ventas/:id/anular
router.put("/:id/anular", (req, res) => {
  const id = Number(req.params.id);
  const restaurarStock = req.body.restaurarStock === true || req.body.restaurarStock === "true";

  try {
    const venta = db.prepare("SELECT id, estado FROM ventas WHERE id = ?").get(id);
    if (!venta) return res.status(404).json({ error: "Venta no encontrada" });
    if (venta.estado === "anulada") return res.status(400).json({ error: "La venta ya está anulada" });

    db.prepare("UPDATE ventas SET estado = 'anulada' WHERE id = ?").run(id);

    if (restaurarStock) {
      const detalles = db.prepare(
        "SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?"
      ).all(id);

      const restaurar = db.prepare(
        "UPDATE productos SET stock = stock + ? WHERE id = ?"
      );
      const restaurarTodo = db.transaction((detalles) => {
        for (const d of detalles) restaurar.run(d.cantidad, d.producto_id);
      });
      restaurarTodo(detalles);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /ventas/:id
router.get("/:id", (req, res) => {
  try {
    const venta = db.prepare(`
      SELECT v.*, c.razon_social AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = ?
    `).get(req.params.id);

    if (!venta) return res.status(404).json({ error: "Venta no encontrada" });

    const detalles = db.prepare(`
      SELECT dv.cantidad, dv.precio, p.nombre
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      WHERE dv.venta_id = ?
    `).all(req.params.id);

    res.json({ ...venta, detalles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;