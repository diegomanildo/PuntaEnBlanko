import express from "express";
import db from "../db.js";
import { isValidPhoneNumber } from "libphonenumber-js";

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Valida CUIT argentino: XX-XXXXXXXX-X (11 dígitos con guiones) */
const validarCuit = (cuit) => /^\d{2}-\d{8}-\d{1}$/.test(cuit);

// ── GET /clientes ─────────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  db.query(
    `SELECT
       c.*,
       COUNT(v.id)          AS cantidad_compras,
       COALESCE(SUM(v.total), 0) AS total_gastado,
       MAX(v.fecha)         AS ultima_compra
     FROM clientes c
     LEFT JOIN ventas v ON v.cliente_id = c.id
     GROUP BY c.id
     ORDER BY c.razon_social ASC`,
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Error al obtener clientes" });
      res.json(rows);
    },
  );
});

// ── GET /clientes/:id ─────────────────────────────────────────────────────────
router.get("/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT
       c.*,
       COUNT(v.id)               AS cantidad_compras,
       COALESCE(SUM(v.total), 0) AS total_gastado,
       MAX(v.fecha)              AS ultima_compra
     FROM clientes c
     LEFT JOIN ventas v ON v.cliente_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [id],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Error al obtener cliente" });
      if (rows.length === 0)
        return res.status(404).json({ message: "Cliente no encontrado" });
      res.json(rows[0]);
    },
  );
});

// ── GET /clientes/:id/compras ─────────────────────────────────────────────────
router.get("/:id/compras", (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT
       v.id,
       v.fecha,
       v.total,
       v.medio_pago,
       v.monto_efectivo,
       v.monto_transferencia
     FROM ventas v
     WHERE v.cliente_id = ?
     ORDER BY v.fecha DESC`,
    [id],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Error al obtener compras" });
      res.json(rows);
    },
  );
});

// ── POST /clientes ────────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  const { razon_social, domicilio, localidad, cuit, telefono, mail } = req.body;

  if (!razon_social?.trim())
    return res.status(400).json({ message: "La razón social es obligatoria" });
  if (!cuit?.trim())
    return res.status(400).json({ message: "El CUIT es obligatorio" });
  if (!validarCuit(cuit.trim()))
    return res.status(400).json({
      message: "El CUIT no tiene el formato correcto (XX-XXXXXXXX-X)",
    });
  if (telefono && !isValidPhoneNumber(telefono.trim(), "AR")) {
    return res.status(400).json({
      message: "El teléfono no tiene un formato válido para Argentina",
    });
  }
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) {
    return res
      .status(400)
      .json({ message: "El mail no tiene un formato válido" });
  }

  // Verificar CUIT duplicado
  db.query(
    "SELECT id FROM clientes WHERE cuit = ?",
    [cuit.trim()],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (rows.length > 0)
        return res
          .status(400)
          .json({ message: "Ya existe un cliente con ese CUIT" });

      db.query(
        `INSERT INTO clientes (razon_social, domicilio, localidad, cuit, telefono, mail)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          razon_social.trim(),
          domicilio?.trim() || null,
          localidad?.trim() || null,
          cuit.trim(),
          telefono?.trim() || null,
          mail?.trim() || null,
        ],
        (err, result) => {
          if (err)
            return res.status(500).json({ message: "Error al crear cliente" });
          res.json({
            success: true,
            id: result.insertId,
            message: `Cliente "${razon_social.trim()}" creado`,
          });
        },
      );
    },
  );
});

// ── PUT /clientes/:id ─────────────────────────────────────────────────────────
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { razon_social, domicilio, localidad, cuit, telefono, mail } = req.body;

  if (!razon_social?.trim())
    return res.status(400).json({ message: "La razón social es obligatoria" });
  if (!cuit?.trim())
    return res.status(400).json({ message: "El CUIT es obligatorio" });
  if (!validarCuit(cuit.trim()))
    return res.status(400).json({
      message: "El CUIT no tiene el formato correcto (XX-XXXXXXXX-X)",
    });
  if (telefono && !isValidPhoneNumber(telefono.trim(), "AR")) {
    return res
      .status(400)
      .json({
        message: "El teléfono no tiene un formato válido para Argentina",
      });
  }
  if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) {
    return res
      .status(400)
      .json({ message: "El mail no tiene un formato válido" });
  }

  // Verificar CUIT duplicado (excluyendo el propio cliente)
  db.query(
    "SELECT id FROM clientes WHERE cuit = ? AND id != ?",
    [cuit.trim(), id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (rows.length > 0)
        return res
          .status(400)
          .json({ message: "Ya existe otro cliente con ese CUIT" });

      db.query(
        `UPDATE clientes
       SET razon_social = ?, domicilio = ?, localidad = ?, cuit = ?, telefono = ?, mail = ?
       WHERE id = ?`,
        [
          razon_social.trim(),
          domicilio?.trim() || null,
          localidad?.trim() || null,
          cuit.trim(),
          telefono?.trim() || null,
          mail?.trim() || null,
          id,
        ],
        (err, result) => {
          if (err)
            return res
              .status(500)
              .json({ message: "Error al actualizar cliente" });
          if (result.affectedRows === 0)
            return res.status(404).json({ message: "Cliente no encontrado" });
          res.json({
            success: true,
            message: `Cliente "${razon_social.trim()}" actualizado`,
          });
        },
      );
    },
  );
});

// ── DELETE /clientes/:id ──────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT razon_social FROM clientes WHERE id = ?",
    [id],
    (err, rows) => {
      if (err || rows.length === 0)
        return res.status(404).json({ message: "Cliente no encontrado" });

      const nombre = rows[0].razon_social;

      // Desvincular ventas antes de eliminar
      db.query(
        "UPDATE ventas SET cliente_id = NULL WHERE cliente_id = ?",
        [id],
        (err) => {
          if (err)
            return res
              .status(500)
              .json({ message: "Error al desvincular ventas" });

          db.query("DELETE FROM clientes WHERE id = ?", [id], (err) => {
            if (err)
              return res
                .status(500)
                .json({ message: "Error al eliminar cliente" });
            res.json({
              success: true,
              message: `Cliente "${nombre}" eliminado`,
            });
          });
        },
      );
    },
  );
});

// ── POST /clientes/:id/vincular-venta ─────────────────────────────────────────
// Vincula una venta existente a un cliente
router.post("/:id/vincular-venta", (req, res) => {
  const { id } = req.params;
  const { venta_id } = req.body;

  if (!venta_id)
    return res.status(400).json({ message: "venta_id es requerido" });

  db.query(
    "UPDATE ventas SET cliente_id = ? WHERE id = ?",
    [id, venta_id],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error al vincular venta" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Venta no encontrada" });
      res.json({ success: true, message: "Venta vinculada al cliente" });
    },
  );
});

// ── DELETE /clientes/desvincular-venta/:venta_id ──────────────────────────────
router.delete("/desvincular-venta/:venta_id", (req, res) => {
  const { venta_id } = req.params;

  db.query(
    "UPDATE ventas SET cliente_id = NULL WHERE id = ?",
    [venta_id],
    (err, result) => {
      if (err)
        return res.status(500).json({ message: "Error al desvincular venta" });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Venta no encontrada" });
      res.json({ success: true, message: "Venta desvinculada" });
    },
  );
});

export default router;
