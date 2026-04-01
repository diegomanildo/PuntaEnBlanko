import express from "express";
import db from "../db.js";

const router = express.Router();

// POST /ventas
router.post("/", (req, res) => {
  const { productos, total, medio_pago, monto_efectivo, monto_transferencia, cliente_id } =
    req.body;

  db.query(
    "INSERT INTO ventas (total, medio_pago, monto_efectivo, monto_transferencia, cliente_id) VALUES (?, ?, ?, ?, ?)",
    [
      total,
      medio_pago,
      monto_efectivo ?? null,
      monto_transferencia ?? null,
      cliente_id ?? null,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error al crear venta" });
      }

      const ventaId = result.insertId;

      let pendientes = productos.length;

      productos.forEach((p) => {
        db.query(
          `INSERT INTO detalle_ventas
          (venta_id, producto_id, cantidad, precio)
          VALUES (?, ?, ?, ?)`,
          [ventaId, p.id, p.cantidad, p.precio],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: "Error en detalle venta" });
            }

            // actualizar stock
            db.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [
              p.cantidad,
              p.id,
            ]);

            pendientes--;

            if (pendientes === 0) {
              res.json({ success: true, id: ventaId });
            }
          },
        );
      });
    },
  );
});

// GET /ventas/hoy
router.get("/hoy", (req, res) => {
  db.query(
    `SELECT v.*, c.razon_social AS cliente_nombre
     FROM ventas v
     LEFT JOIN clientes c ON v.cliente_id = c.id
     WHERE DATE(v.fecha) = CURDATE()
     AND v.estado = 'normal'
     ORDER BY v.fecha DESC`,
    (err, ventas) => {
      if (err) return res.status(500).json(err);

      db.query(
        `SELECT SUM(total) as total
         FROM ventas
         WHERE DATE(fecha) = CURDATE()
         AND estado = 'normal'`,        // 👈
        (err, totalResult) => {
          if (err) return res.status(500).json(err);
          res.json({ ventas, total: totalResult[0].total || 0 });
        }
      );
    }
  );
});

// GET /ventas/mes
router.get("/mes", (req, res) => {
  db.query(
    `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') as dia, COUNT(*) as cantidad, SUM(total) as total
    FROM ventas
    WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())
    AND estado = 'normal'
    GROUP BY DATE(fecha)
    ORDER BY dia ASC;`,
    (err, porDia) => {
      if (err) return res.status(500).json(err);

      db.query(
        `SELECT COUNT(*) as cantidad, SUM(total) as total
         FROM ventas
         WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())
         AND estado = 'normal'`,
        (err, resumen) => {
          if (err) return res.status(500).json(err);

          db.query(
            `SELECT p.nombre, SUM(dv.cantidad) as total_vendido
              FROM detalle_ventas dv
              JOIN productos p ON dv.producto_id = p.id
              JOIN ventas v ON dv.venta_id = v.id
              WHERE MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())
              AND v.estado = 'normal'
              GROUP BY p.nombre
              ORDER BY total_vendido DESC
              LIMIT 3`,
            (err, topProducto) => {
              if (err) return res.status(500).json(err);

              res.json({
                porDia,
                total: resumen[0].total || 0,
                cantidadVentas: resumen[0].cantidad || 0,
                topProductos: topProducto || [],
              });
            },
          );
        },
      );
    },
  );
});

// GET /ventas/dia/:fecha
router.get("/dia/:fecha", (req, res) => {
  const { fecha } = req.params;

  db.query(
    `SELECT v.*, c.razon_social AS cliente_nombre
     FROM ventas v
     LEFT JOIN clientes c ON v.cliente_id = c.id
     WHERE DATE(v.fecha) = ?
     AND v.estado = 'normal'
     ORDER BY v.fecha DESC`,
    [fecha],
    (err, ventas) => {
      if (err) return res.status(500).json(err);

      db.query(
        `SELECT SUM(total) as total FROM ventas
         WHERE DATE(fecha) = ?
         AND estado = 'normal'`,        // 👈
        [fecha],
        (err, totalResult) => {
          if (err) return res.status(500).json(err);
          res.json({ ventas, total: totalResult[0].total || 0 });
        }
      );
    }
  );
});

// PUT /ventas/:id/anular
router.put("/:id/anular", (req, res) => {
  const id = Number(req.params.id);
  const restaurarStock = req.body.restaurarStock === true || req.body.restaurarStock === "true";

  db.query(
    "SELECT id, estado FROM ventas WHERE id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error("Error SELECT ventas:", err);
        return res.status(500).json({ error: "Error al buscar venta", detalle: err.message });
      }
      if (!rows.length) return res.status(404).json({ error: "Venta no encontrada" });
      if (rows[0].estado === "anulada")
        return res.status(400).json({ error: "La venta ya está anulada" });

      db.query(
        "UPDATE ventas SET estado = 'anulada' WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            console.error("Error UPDATE ventas:", err);
            return res.status(500).json({ error: "Error al anular venta", detalle: err.message });
          }

          if (!restaurarStock) {
            return res.json({ success: true });
          }

          db.query(
            "SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = ?",
            [id],
            (err, detalles) => {
              if (err) {
                console.error("Error SELECT detalle_ventas:", err);
                return res.status(500).json({ error: "Error al obtener detalle", detalle: err.message });
              }

              if (detalles.length === 0) return res.json({ success: true });

              let pendientes = detalles.length;
              detalles.forEach((d) => {
                db.query(
                  "UPDATE productos SET stock = stock + ? WHERE id = ?",
                  [d.cantidad, d.producto_id],
                  (err) => {
                    if (err) console.error("Error restaurando stock:", err);
                    pendientes--;
                    if (pendientes === 0) res.json({ success: true });
                  }
                );
              });
            }
          );
        }
      );
    }
  );
});

// GET /ventas/:id
router.get("/:id", (req, res) => {
  const { id } = req.params;

  // Obtener venta + cliente
  db.query(
    `SELECT v.*, c.razon_social AS cliente_nombre
     FROM ventas v
     LEFT JOIN clientes c ON v.cliente_id = c.id
     WHERE v.id = ?`,
    [id],
    (err, ventaDatos) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error obteniendo venta" });
      }

      // Obtener detalle
      db.query(
        `SELECT dv.cantidad, dv.precio, p.nombre
         FROM detalle_ventas dv
         JOIN productos p ON dv.producto_id = p.id
         WHERE dv.venta_id = ?`,
        [id],
        (err, detalles) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error obteniendo detalle" });
          }

          res.json({
            ...ventaDatos[0],
            detalles
          });
        }
      );
    }
  );
});

export default router;
