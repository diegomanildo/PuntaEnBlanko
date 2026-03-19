import express from "express";
import db from "../db.js";

const router = express.Router();

// POST /presupuestos — crear presupuesto
router.post("/", (req, res) => {
  const { productos, total, cliente_nombre, medio_pago, monto_efectivo, monto_transferencia } = req.body;

  db.query(
    `INSERT INTO presupuestos (total, cliente_nombre, medio_pago, monto_efectivo, monto_transferencia)
     VALUES (?, ?, ?, ?, ?)`,
    [
      total,
      cliente_nombre ?? null,
      medio_pago ?? "efectivo",
      medio_pago === "mix" ? (monto_efectivo ?? null) : null,
      medio_pago === "mix" ? (monto_transferencia ?? null) : null,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error al crear presupuesto" });
      }

      const presupuestoId = result.insertId;
      let pendientes = productos.length;

      productos.forEach((p) => {
        db.query(
          `INSERT INTO detalle_presupuestos (presupuesto_id, producto_id, cantidad, precio)
           VALUES (?, ?, ?, ?)`,
          [presupuestoId, p.id, p.cantidad, p.precio],
          (err) => {
            if (err) {
              console.error(err);
              return res
                .status(500)
                .json({ success: false, message: "Error en detalle presupuesto" });
            }
            pendientes--;
            if (pendientes === 0) {
              res.json({ success: true, id: presupuestoId, message: "Presupuesto guardado" });
            }
          },
        );
      });
    },
  );
});

// PUT /presupuestos/:id — actualizar presupuesto
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { productos, total, cliente_nombre, medio_pago, monto_efectivo, monto_transferencia } = req.body;

  db.query(
    `UPDATE presupuestos
     SET total = ?, cliente_nombre = ?, medio_pago = ?, monto_efectivo = ?, monto_transferencia = ?
     WHERE id = ?`,
    [
      total,
      cliente_nombre ?? null,
      medio_pago ?? "efectivo",
      medio_pago === "mix" ? (monto_efectivo ?? null) : null,
      medio_pago === "mix" ? (monto_transferencia ?? null) : null,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error al actualizar presupuesto" });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ success: false, message: "Presupuesto no encontrado" });

      // Reemplazar detalle
      db.query(
        "DELETE FROM detalle_presupuestos WHERE presupuesto_id = ?",
        [id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Error al limpiar detalle" });
          }

          let pendientes = productos.length;

          productos.forEach((p) => {
            db.query(
              `INSERT INTO detalle_presupuestos (presupuesto_id, producto_id, cantidad, precio)
               VALUES (?, ?, ?, ?)`,
              [id, p.id, p.cantidad, p.precio],
              (err) => {
                if (err) {
                  console.error(err);
                  return res
                    .status(500)
                    .json({ success: false, message: "Error en detalle presupuesto" });
                }
                pendientes--;
                if (pendientes === 0) {
                  res.json({ success: true, message: "Presupuesto actualizado" });
                }
              },
            );
          });
        },
      );
    },
  );
});

// POST /presupuestos/:id/convertir — convertir a venta
router.post("/:id/convertir", (req, res) => {
  const { id } = req.params;
  const { medio_pago, monto_efectivo, monto_transferencia } = req.body ?? {};

  db.query(
    "SELECT * FROM presupuestos WHERE id = ?",
    [id],
    (err, presupuestos) => {
      if (err || presupuestos.length === 0)
        return res.status(404).json({ success: false, message: "Presupuesto no encontrado" });

      const presupuesto = presupuestos[0];

      // Usar el medio de pago del body si se envió, o el guardado en el presupuesto
      const medioPagoFinal = medio_pago ?? presupuesto.medio_pago ?? "efectivo";
      const montoEfectivoFinal =
        medioPagoFinal === "mix" ? (monto_efectivo ?? presupuesto.monto_efectivo ?? null) : null;
      const montoTransferenciaFinal =
        medioPagoFinal === "mix"
          ? (monto_transferencia ?? presupuesto.monto_transferencia ?? null)
          : null;

      db.query(
        "SELECT * FROM detalle_presupuestos WHERE presupuesto_id = ?",
        [id],
        (err, detalle) => {
          if (err)
            return res
              .status(500)
              .json({ success: false, message: "Error obteniendo detalle" });

          db.query(
            `INSERT INTO ventas (total, medio_pago, monto_efectivo, monto_transferencia)
             VALUES (?, ?, ?, ?)`,
            [presupuesto.total, medioPagoFinal, montoEfectivoFinal, montoTransferenciaFinal],
            (err, result) => {
              if (err)
                return res
                  .status(500)
                  .json({ success: false, message: "Error al crear venta" });

              const ventaId = result.insertId;
              let pendientes = detalle.length;

              detalle.forEach((d) => {
                db.query(
                  `INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio)
                   VALUES (?, ?, ?, ?)`,
                  [ventaId, d.producto_id, d.cantidad, d.precio],
                  (err) => {
                    if (err) {
                      console.error(err);
                      return res
                        .status(500)
                        .json({ success: false, message: "Error en detalle venta" });
                    }

                    db.query(
                      "UPDATE productos SET stock = stock - ? WHERE id = ?",
                      [d.cantidad, d.producto_id],
                    );

                    pendientes--;
                    if (pendientes === 0) {
                      db.query(
                        "UPDATE presupuestos SET estado = 'convertido', venta_id = ? WHERE id = ?",
                        [ventaId, id],
                      );
                      res.json({ success: true, venta_id: ventaId });
                    }
                  },
                );
              });
            },
          );
        },
      );
    },
  );
});

// DELETE /presupuestos/:id — eliminar presupuesto
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM presupuestos WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Error al eliminar presupuesto" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Presupuesto no encontrado" });

    res.json({ success: true, message: "Presupuesto eliminado" });
  });
});

// GET /presupuestos — listar todos
router.get("/", (req, res) => {
  db.query(
    `SELECT * FROM presupuestos ORDER BY fecha DESC`,
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    },
  );
});

// GET /presupuestos/:id — detalle de un presupuesto
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT dp.producto_id, dp.cantidad, dp.precio, p.nombre
     FROM detalle_presupuestos dp
     JOIN productos p ON dp.producto_id = p.id
     WHERE dp.presupuesto_id = ?`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    },
  );
});

export default router;