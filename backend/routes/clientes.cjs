const express = require("express");
const db = require("../db.cjs");
const { isValidPhoneNumber } = require("libphonenumber-js");

const router = express.Router();

const validarCuit = (cuit) => /^\d{2}-\d{8}-\d{1}$/.test(cuit);

// GET /clientes
router.get("/", (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /clientes/:id
router.get("/:id", (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /clientes/:id/compras
router.get("/:id/compras", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT v.id, v.fecha, v.total, v.medio_pago, v.monto_efectivo, v.monto_transferencia
      FROM ventas v
      WHERE v.cliente_id = ?
      ORDER BY v.fecha DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /clientes
router.post("/", (req, res) => {
  const { razon_social, domicilio, localidad, cuit, telefono, mail } = req.body;

  if (!razon_social?.trim()) return res.status(400).json({ message: "La razón social es obligatoria" });
  if (!cuit?.trim()) return res.status(400).json({ message: "El CUIT es obligatorio" });
  if (!validarCuit(cuit.trim())) return res.status(400).json({ message: "El CUIT no tiene el formato correcto (XX-XXXXXXXX-X)" });
  if (telefono && !isValidPhoneNumber(telefono.trim(), "AR")) return res.status(400).json({ message: "El teléfono no tiene un formato válido para Argentina" });
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) return res.status(400).json({ message: "El mail no tiene un formato válido" });

  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /clientes/:id
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { razon_social, domicilio, localidad, cuit, telefono, mail } = req.body;

  if (!razon_social?.trim()) return res.status(400).json({ message: "La razón social es obligatoria" });
  if (!cuit?.trim()) return res.status(400).json({ message: "El CUIT es obligatorio" });
  if (!validarCuit(cuit.trim())) return res.status(400).json({ message: "El CUIT no tiene el formato correcto (XX-XXXXXXXX-X)" });
  if (telefono && !isValidPhoneNumber(telefono.trim(), "AR")) return res.status(400).json({ message: "El teléfono no tiene un formato válido para Argentina" });
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) return res.status(400).json({ message: "El mail no tiene un formato válido" });

  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /clientes/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const row = db.prepare("SELECT razon_social FROM clientes WHERE id = ?").get(id);
    if (!row) return res.status(404).json({ message: "Cliente no encontrado" });

    db.prepare("UPDATE ventas SET cliente_id = NULL WHERE cliente_id = ?").run(id);
    db.prepare("DELETE FROM clientes WHERE id = ?").run(id);

    res.json({ success: true, message: `Cliente "${row.razon_social}" eliminado` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /clientes/:id/vincular-venta
router.post("/:id/vincular-venta", (req, res) => {
  const { id } = req.params;
  const { venta_id } = req.body;
  if (!venta_id) return res.status(400).json({ message: "venta_id es requerido" });

  try {
    const result = db.prepare("UPDATE ventas SET cliente_id = ? WHERE id = ?").run(id, venta_id);
    if (result.changes === 0) return res.status(404).json({ message: "Venta no encontrada" });
    res.json({ success: true, message: "Venta vinculada al cliente" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /clientes/desvincular-venta/:venta_id
router.delete("/desvincular-venta/:venta_id", (req, res) => {
  try {
    const result = db.prepare("UPDATE ventas SET cliente_id = NULL WHERE id = ?").run(req.params.venta_id);
    if (result.changes === 0) return res.status(404).json({ message: "Venta no encontrada" });
    res.json({ success: true, message: "Venta desvinculada" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;