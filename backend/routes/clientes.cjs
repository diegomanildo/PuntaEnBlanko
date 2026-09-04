const express = require("express");
const db = require("../db.cjs");
const { isValidPhoneNumber } = require("libphonenumber-js");

const router = express.Router();

const validarCuit = (cuit) => /^\d{2}-\d{8}-\d{1}$/.test(cuit);

// Valida el cuerpo de un alta/edición de cliente.
// Devuelve un string con el error, o null si está todo bien.
function validarCliente({ razon_social, cuit, telefono, mail }) {
  if (!razon_social?.trim()) return "La razón social es obligatoria";
  if (!cuit?.trim()) return "El CUIT es obligatorio";
  if (!validarCuit(cuit.trim()))
    return "El CUIT no tiene el formato correcto (XX-XXXXXXXX-X)";
  if (telefono && !isValidPhoneNumber(telefono.trim(), "AR"))
    return "El teléfono no tiene un formato válido para Argentina";
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim()))
    return "El mail no tiene un formato válido";
  return null;
}

// GET /clientes
router.get("/", (req, res) => {
  const rows = db.prepare(`
    SELECT c.*,
      COUNT(v.id) AS cantidad_compras,
      COALESCE(SUM(v.total), 0) AS total_gastado,
      MAX(v.fecha) AS ultima_compra
    FROM clientes c
    LEFT JOIN ventas v ON v.cliente_id = c.id
    GROUP BY c.id
    ORDER BY c.razon_social ASC
  `).all();
  res.json(rows);
});

// GET /clientes/:id
router.get("/:id", (req, res) => {
  const row = db.prepare(`
    SELECT c.*,
      COUNT(v.id) AS cantidad_compras,
      COALESCE(SUM(v.total), 0) AS total_gastado,
      MAX(v.fecha) AS ultima_compra
    FROM clientes c
    LEFT JOIN ventas v ON v.cliente_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
  `).get(req.params.id);
  if (!row) return res.status(404).json({ message: "Cliente no encontrado" });
  res.json(row);
});

// GET /clientes/:id/compras
router.get("/:id/compras", (req, res) => {
  const rows = db.prepare(`
    SELECT v.id, v.fecha, v.total, v.medio_pago, v.monto_efectivo, v.monto_transferencia
    FROM ventas v
    WHERE v.cliente_id = ?
    ORDER BY v.fecha DESC
  `).all(req.params.id);
  res.json(rows);
});

// POST /clientes
router.post("/", (req, res) => {
  const { razon_social, domicilio, localidad, cuit, telefono, mail } = req.body;

  const err = validarCliente(req.body);
  if (err) return res.status(400).json({ message: err });

  const existente = db.prepare("SELECT id FROM clientes WHERE cuit = ?").get(cuit.trim());
  if (existente) return res.status(400).json({ message: "Ya existe un cliente con ese CUIT" });

  const result = db.prepare(
    "INSERT INTO clientes (razon_social, domicilio, localidad, cuit, telefono, mail) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    razon_social.trim(),
    domicilio?.trim() || null,
    localidad?.trim() || null,
    cuit.trim(),
    telefono?.trim() || null,
    mail?.trim() || null
  );

  res.json({ success: true, id: result.lastInsertRowid, message: `Cliente "${razon_social.trim()}" creado` });
});

// PUT /clientes/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { razon_social, domicilio, localidad, cuit, telefono, mail } = req.body;

  const err = validarCliente(req.body);
  if (err) return res.status(400).json({ message: err });

  const existente = db.prepare("SELECT id FROM clientes WHERE cuit = ? AND id != ?").get(cuit.trim(), id);
  if (existente) return res.status(400).json({ message: "Ya existe otro cliente con ese CUIT" });

  const result = db.prepare(`
    UPDATE clientes SET razon_social=?, domicilio=?, localidad=?, cuit=?, telefono=?, mail=? WHERE id=?
  `).run(
    razon_social.trim(),
    domicilio?.trim() || null,
    localidad?.trim() || null,
    cuit.trim(),
    telefono?.trim() || null,
    mail?.trim() || null,
    id
  );

  if (result.changes === 0) return res.status(404).json({ message: "Cliente no encontrado" });
  res.json({ success: true, message: `Cliente "${razon_social.trim()}" actualizado` });
});

// DELETE /clientes/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const row = db.prepare("SELECT razon_social FROM clientes WHERE id = ?").get(id);
  if (!row) return res.status(404).json({ message: "Cliente no encontrado" });

  db.prepare("UPDATE ventas SET cliente_id = NULL WHERE cliente_id = ?").run(id);
  db.prepare("DELETE FROM clientes WHERE id = ?").run(id);

  res.json({ success: true, message: `Cliente "${row.razon_social}" eliminado` });
});

// POST /clientes/:id/vincular-venta
router.post("/:id/vincular-venta", (req, res) => {
  const { id } = req.params;
  const { venta_id } = req.body;
  if (!venta_id) return res.status(400).json({ message: "venta_id es requerido" });

  const result = db.prepare("UPDATE ventas SET cliente_id = ? WHERE id = ?").run(id, venta_id);
  if (result.changes === 0) return res.status(404).json({ message: "Venta no encontrada" });
  res.json({ success: true, message: "Venta vinculada al cliente" });
});

// DELETE /clientes/desvincular-venta/:venta_id
router.delete("/desvincular-venta/:venta_id", (req, res) => {
  const result = db.prepare("UPDATE ventas SET cliente_id = NULL WHERE id = ?").run(req.params.venta_id);
  if (result.changes === 0) return res.status(404).json({ message: "Venta no encontrada" });
  res.json({ success: true, message: "Venta desvinculada" });
});

module.exports = router;
