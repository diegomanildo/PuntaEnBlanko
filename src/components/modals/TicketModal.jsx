import { Printer, X } from "lucide-react";
import { useEffect } from "react";

const PRINT_STYLES = `
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }
  body * { visibility: hidden !important; }
  #ticket-print, #ticket-print * { visibility: visible !important; }
  #ticket-print {
    position: fixed !important;
    top: 0; left: 0;
    width: 80mm;
    padding: 6mm 4mm;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    color: #000;
    background: #fff;
  }
}
`;

const SEP = "=".repeat(58);

/** Formatea un número con 2 decimales y coma, sin separador de miles. Ej: 40000,00 */
const fmt = (n) => Number(n).toFixed(2).replace(".", ",");

function TicketModal({ ticket, onClose }) {
  useEffect(() => {
    if (!document.getElementById("ticket-print-styles")) {
      const style = document.createElement("style");
      style.id = "ticket-print-styles";
      style.textContent = PRINT_STYLES;
      document.head.appendChild(style);
    }
  }, []);

  const handlePrint = () => window.print();

  const fecha = new Date(ticket.fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const nro = String(ticket.id).padStart(8, "0");

  const labelMedioPago =
    {
      efectivo: "EFECTIVO",
      transferencia: "TRANSFERENCIA",
      mix: "MIX",
    }[ticket.medio_pago] ?? ticket.medio_pago.toUpperCase();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 8px 40px rgba(0,0,0,.18)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="ticket-fw-bold" style={{ fontSize: 15 }}>
            Vista previa del ticket
          </span>
          <button className="btn btn-sm btn-light" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* ── TICKET (lo que se imprime) ── */}
        <div
          id="ticket-print"
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            background: "#fff",
            border: "1px dashed #bbb",
            borderRadius: 8,
            padding: "14px 16px",
            color: "#000",
            lineHeight: 1.6,
            overflowX: "auto",
          }}
        >
          {/* Fecha y número */}
          <div>
            Fecha : {fecha}{"  "}Nro : {nro}
          </div>
          <div>
            <span style={{ marginRight: "2ch" }}>CF</span>CONSUMIDOR FINAL
          </div>

          <div style={{ marginTop: 4 }}>{SEP}</div>

          {/* Encabezado columnas */}
          <div style={{ display: "flex", whiteSpace: "nowrap" }}>
            <span style={{ width: "7ch" }}>Cant.</span>
            <span style={{ flex: 1, overflow: "hidden" }}>Producto</span>
            <span style={{ width: "10ch", textAlign: "right" }}>P.Unit.</span>
            <span style={{ width: "9ch", textAlign: "right" }}>Total</span>
          </div>

          <div>{SEP}</div>

          {/* Productos */}
          {ticket.productos.map((p, i) => {
            const subtotal = p.precio * p.cantidad;
            return (
              <div key={i} style={{ display: "flex", whiteSpace: "nowrap" }}>
                <span style={{ width: "7ch" }}>{p.cantidad}</span>
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.nombre.toUpperCase()}
                </span>
                <span style={{ width: "10ch", textAlign: "right" }}>
                  {fmt(p.precio)}
                </span>
                <span style={{ width: "9ch", textAlign: "right" }}>
                  {fmt(subtotal)}
                </span>
              </div>
            );
          })}

          <div style={{ marginTop: 4 }}>{SEP}</div>

          {/* Subtotal / Descuento / Total */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>{fmt(ticket.total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Descuento</span>
            <span>0,00</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
            }}
          >
            <span>Total</span>
            <span>{fmt(ticket.total)}</span>
          </div>

          {/* Medio de pago */}
          <div style={{ marginTop: 2, fontSize: 10 }}>
            Pago: {labelMedioPago}
            {ticket.medio_pago === "mix" && (
              <span>
                {"  "}Efectivo: ${fmt(ticket.monto_efectivo)}
                {"  "}Transferencia: ${fmt(ticket.monto_transferencia)}
              </span>
            )}
          </div>

          <div style={{ marginTop: 4 }}>{SEP}</div>

          {/* Pie */}
          <div style={{ textAlign: "center", marginTop: 6 }}>
            Gracias por su Visita!!
          </div>
        </div>
        {/* ── FIN TICKET ── */}

        {/* Botones */}
        <div className="d-flex gap-2 mt-3">
          <button
            className="btn btn-outline-secondary flex-fill"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            className="btn btn-dark flex-fill d-flex align-items-center justify-content-center gap-2"
            onClick={handlePrint}
          >
            <Printer size={15} /> Imprimir ticket
          </button>
        </div>
      </div>
    </div>
  );
}

export default TicketModal;
