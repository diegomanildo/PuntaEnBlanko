const express = require("express");
const db = require("../db.cjs");
const { validarItems, validarTotal } = require("../utils/utils.cjs");

const router = express.Router();

const MEDIOS_PAGO = ["efectivo", "transferencia", "mix"];

// Resumen mensual (usado por GET /mes y GET /mes/:anio/:mes).
// periodo tiene formato 'YYYY-MM'.
function resumenDeMes(periodo) {
  const porDia = db.prepare(`
    SELECT strftime('%Y-%m-%d', fecha) as dia, COUNT(*) as cantidad, SUM(total) as total
    FROM ventas
    WHERE strftime('%Y-%m', fecha) = ?
    AND estado = 'normal'
    GROUP BY strftime('%Y-%m-%d', fecha)
    ORDER BY dia ASC
  `).all(periodo);

  const resumen = db.prepare(`
    SELECT COUNT(*) as cantidad, COALESCE(SUM(total), 0) as total
    FROM ventas
    WHERE strftime('%Y-%m', fecha) = ?
    AND estado = 'normal'
  `).get(periodo);

  const topProductos = db.prepare(`
    SELECT p.nombre, SUM(dv.cantidad) as total_vendido
    FROM detalle_ventas dv
    JOIN productos p ON dv.producto_id = p.id
    JOIN ventas v ON dv.venta_id = v.id
    WHERE strftime('%Y-%m', v.fecha) = ?
    AND v.estado = 'normal'
    GROUP BY p.nombre
    ORDER BY total_vendido DESC
    LIMIT 3
  `).all(periodo);

  return {
    porDia,
    total: resumen.total || 0,
    cantidadVentas: resumen.cantidad || 0,
    topProductos,
  };
}

// POST /ventas
router.post("/", (req, res) => {
  const { productos, total, medio_pago, monto_efectivo, monto_transferencia, cliente_id } = req.body;

  const errItems = validarItems(productos);
  if (errItems) return res.status(400).json({ message: errItems });

  const errTotal = validarTotal(total);
  if (errTotal) return res.status(400).json({ message: errTotal });

  if (medio_pago && !MEDIOS_PAGO.includes(medio_pago))
    return res.status(400).json({ message: "Medio de pago inválido" });

  if (medio_pago === "mix") {
    const suma = Number(monto_efectivo || 0) + Number(monto_transferencia || 0);
    if (Math.abs(suma - Number(total)) >= 1)
      return res.status(400).json({ message: "Los montos del pago mixto no suman el total" });
  }

  // Chequeo de existencia y stock contra la base
  const ids = productos.map((p) => p.id);
  const enBase = db
    .prepare(
      `SELECT id, nombre, stock, tiene_stock FROM productos WHERE id IN (${ids.map(() => "?").join(",")})`
    )
    .all(ids);
  const porId = new Map(enBase.map((r) => [r.id, r]));

  for (const p of productos) {
    const prod = porId.get(p.id);
    if (!prod) return res.status(400).json({ message: `El producto ${p.id} no existe` });
    if (prod.tiene_stock && Number(p.cantidad) > prod.stock)
      return res.status(400).json({
        message: `Stock insuficiente de "${prod.nombre}" (disponible: ${prod.stock})`,
      });
  }

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
});

// GET /ventas/hoy
router.get("/hoy", (req, res) => {
  const ventas = db.prepare(`
    SELECT v.*, c.razon_social AS cliente_nombre
    FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    WHERE DATE(v.fecha) = DATE('now', 'localtime')
    ORDER BY v.fecha DESC
  `).all();

  const { total } = db.prepare(`
    SELECT COALESCE(SUM(total), 0) as total
    FROM ventas
    WHERE DATE(fecha) = DATE('now', 'localtime')
    AND estado = 'normal'
  `).get();

  res.json({ ventas, total });
});

// GET /ventas/mes
router.get("/mes", (req, res) => {
  const now = new Date();
  const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  res.json(resumenDeMes(periodo));
});

// GET /ventas/dia/:fecha
router.get("/dia/:fecha", (req, res) => {
  const { fecha } = req.params;
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
});

// GET /ventas/historial
router.get("/historial", (req, res) => {
  const ventas = db.prepare(`
    SELECT v.*, c.razon_social AS cliente_nombre
    FROM ventas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    ORDER BY v.fecha DESC
    LIMIT 50
  `).all();
  res.json(ventas);
});

// PUT /ventas/:id/anular
router.put("/:id/anular", (req, res) => {
  const id = Number(req.params.id);
  const restaurarStock = req.body.restaurarStock === true || req.body.restaurarStock === "true";

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
});

// GET /ventas/:id
router.get("/:id", (req, res) => {
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
});

// GET /ventas/mes/:anio/:mes
router.get("/mes/:anio/:mes", (req, res) => {
  const { anio, mes } = req.params;
  const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
  res.json(resumenDeMes(periodo));
});

module.exports = router;
