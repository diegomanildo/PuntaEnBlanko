const capitalizarNombre = (str) =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Valida la lista de renglones de una venta o presupuesto.
// Devuelve un string con el error, o null si está todo bien.
function validarItems(productos) {
  if (!Array.isArray(productos) || productos.length === 0)
    return "La operación no tiene productos";
  for (const p of productos) {
    if (!p || p.id == null) return "Hay un producto inválido en la lista";
    if (!Number.isInteger(Number(p.cantidad)) || Number(p.cantidad) <= 0)
      return "Hay una cantidad inválida en la lista";
    if (!Number.isFinite(Number(p.precio)) || Number(p.precio) < 0)
      return "Hay un precio inválido en la lista";
  }
  return null;
}

// Valida un total monetario. Devuelve string con el error o null.
function validarTotal(total) {
  if (!Number.isFinite(Number(total)) || Number(total) < 0)
    return "El total es inválido";
  return null;
}

module.exports = { capitalizarNombre, validarItems, validarTotal };
