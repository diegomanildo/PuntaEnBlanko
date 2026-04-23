const express = require("express");
const db = require("../db.cjs");

const router = express.Router();

// POST /presupuestos
router.post("/", (req, res) => {
  const { productos, total, cliente_nombre, medio_pago, monto_efectivo, monto_transferencia } = req.body;

  try {
    const guardar = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO presupuestos (total, cliente_nombre, medio_pago, monto_efectivo, monto_transferencia)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        total,
        cliente_nombre ?? null,
        medio_pago ?? "efectivo",
        medio_pago === "mix" ? (monto_efectivo ?? null) : null,
        medio_pago === "mix" ? (monto_transferencia ?? null) : null
      );

      const presupuestoId = result.lastInsertRowid;

      for (const p of productos) {
        db.prepare(
          "INSERT INTO detalle_presupuestos (presupuesto_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)"
        ).run(presupuestoId, p.id, p.cantidad, p.precio);
      }

      return presupuestoId;
    });

    const presupuestoId = guardar();

    res.json({ success: true, id: presupuestoId, message: "Presupuesto guardado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /presupuestos/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { productos, total, cliente_nombre, medio_pago, monto_efectivo, monto_transferencia } = req.body;

  try {
    const result = db.prepare(`
      UPDATE presupuestos SET total=?, cliente_nombre=?, medio_pago=?, monto_efectivo=?, monto_transferencia=?
      WHERE id=?
    `).run(
      total,
      cliente_nombre ?? null,
      medio_pago ?? "efectivo",
      medio_pago === "mix" ? (monto_efectivo ?? null) : null,
      medio_pago === "mix" ? (monto_transferencia ?? null) : null,
      id
    );

    if (result.changes === 0) return res.status(404).json({ success: false, message: "Presupuesto no encontrado" });

    db.prepare("DELETE FROM detalle_presupuestos WHERE presupuesto_id = ?").run(id);

    const insertDetalle = db.prepare(
      "INSERT INTO detalle_presupuestos (presupuesto_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)"
    );
    const insertarTodo = db.transaction((productos) => {
      for (const p of productos) insertDetalle.run(id, p.id, p.cantidad, p.precio);
    });
    insertarTodo(productos);

    res.json({ success: true, message: "Presupuesto actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /presupuestos/:id/convertir
router.post("/:id/convertir", (req, res) => {
  const { id } = req.params;
  const { medio_pago, monto_efectivo, monto_transferencia } = req.body ?? {};

  try {
    const presupuesto = db.prepare("SELECT * FROM presupuestos WHERE id = ?").get(id);
    if (!presupuesto) return res.status(404).json({ success: false, message: "Presupuesto no encontrado" });

    const medioPagoFinal = medio_pago ?? presupuesto.medio_pago ?? "efectivo";
    const montoEfectivoFinal = medioPagoFinal === "mix" ? (monto_efectivo ?? presupuesto.monto_efectivo ?? null) : null;
    const montoTransferenciaFinal = medioPagoFinal === "mix" ? (monto_transferencia ?? presupuesto.monto_transferencia ?? null) : null;

    const detalle = db.prepare("SELECT * FROM detalle_presupuestos WHERE presupuesto_id = ?").all(id);

    const convertir = db.transaction(() => {
      const ventaResult = db.prepare(
        "INSERT INTO ventas (total, medio_pago, monto_efectivo, monto_transferencia) VALUES (?, ?, ?, ?)"
      ).run(presupuesto.total, medioPagoFinal, montoEfectivoFinal, montoTransferenciaFinal);

      const ventaId = ventaResult.lastInsertRowid;

      for (const d of detalle) {
        db.prepare(
          "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio) VALUES (?, ?, ?, ?)"
        ).run(ventaId, d.producto_id, d.cantidad, d.precio);

        db.prepare("UPDATE productos SET stock = stock - ? WHERE id = ?").run(d.cantidad, d.producto_id);
      }

      db.prepare("UPDATE presupuestos SET estado = 'convertido', venta_id = ? WHERE id = ?").run(ventaId, id);

      return ventaId;
    });

    const ventaId = convertir();
    res.json({ success: true, venta_id: ventaId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /presupuestos/:id
router.delete("/:id", (req, res) => {
  try {
    const result = db.prepare("DELETE FROM presupuestos WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ success: false, message: "Presupuesto no encontrado" });
    res.json({ success: true, message: "Presupuesto eliminado" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /presupuestos
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM presupuestos ORDER BY fecha DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /presupuestos/:id
router.get("/:id", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT dp.producto_id, dp.cantidad, dp.precio, p.nombre
      FROM detalle_presupuestos dp
      JOIN productos p ON dp.producto_id = p.id
      WHERE dp.presupuesto_id = ?
    `).all(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;