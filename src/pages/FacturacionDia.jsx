import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { PORT } from "../../backend/config";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";
import BackButton from "../components/UI/BackButton";

function FacturacionDia() {
  const location = useLocation();
  const backDir = location.state?.backDir;

  const { fecha } = useParams();
  const [ventas, setVentas] = useState([]);
  const [total, setTotal] = useState(0);
  const [detalles, setDetalles] = useState({});
  const [ventaAbierta, setVentaAbierta] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:${PORT}/ventas/dia/${fecha}`)
      .then((r) => r.json())
      .then((data) => {
        setVentas(data.ventas);
        setTotal(data.total);
      });
  }, [fecha]);

  const toggleDetalle = async (id) => {
    if (ventaAbierta === id) {
      setVentaAbierta(null);
      return;
    }

    if (!detalles[id]) {
      const res = await fetch(`http://localhost:${PORT}/ventas/${id}`);
      const data = await res.json();

      setDetalles({ ...detalles, [id]: data });
    }

    setVentaAbierta(id);
  };

  const fechaFormateada = new Date(fecha + "T12:00:00").toLocaleDateString(
    "es-AR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  const ticketPromedio =
    ventas.length > 0 ? Math.round(total / ventas.length) : 0;

  return (
    <div>
      <BackButton dir={backDir} />
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 bg-warning bg-opacity-10"
          style={{ width: 42, height: 42, flexShrink: 0 }}
        >
          <Receipt size={20} className="text-warning" />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
            Facturación del día
          </h2>
          <small className="text-muted" style={{ textTransform: "capitalize" }}>
            {fechaFormateada}
          </small>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p
              className="text-muted mb-1"
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Total facturado
            </p>
            <p
              className="text-success fw-bold mb-0"
              style={{ fontSize: "1.7rem", lineHeight: 1.1 }}
            >
              ${Number(total).toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p
              className="text-muted mb-1"
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Ventas
            </p>
            <p
              className="fw-bold mb-0"
              style={{ fontSize: "1.7rem", lineHeight: 1.1 }}
            >
              {ventas.length}
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p
              className="text-muted mb-1"
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Precio de Venta promedio
            </p>
            <p
              className="text-primary fw-bold mb-0"
              style={{ fontSize: "1.7rem", lineHeight: 1.1 }}
            >
              ${ticketPromedio.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {ventas.length === 0 ? (
        <div className="card p-5 text-center" style={{ borderRadius: 12 }}>
          <Receipt
            size={36}
            strokeWidth={1.2}
            className="text-muted mx-auto mb-3"
          />
          <p className="text-muted mb-0">No hay ventas registradas este día</p>
        </div>
      ) : (
        <div className="card" style={{ borderRadius: 12, overflow: "hidden" }}>
          <table className="table mb-0">
            <thead>
              <tr>
                <th style={{ width: 44 }}></th>
                <th>ID</th>
                <th>Cliente</th>
                <th>Hora</th>
                <th>Pago</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <React.Fragment key={v.id}>
                  <tr
                    style={{
                      background:
                        ventaAbierta === v.id
                          ? "var(--bs-success-bg-subtle)"
                          : undefined,
                    }}
                  >
                    <td>
                      <button
                        className={`btn btn-sm ${ventaAbierta === v.id ? "btn-success" : "btn-outline-secondary"} d-flex align-items-center`}
                        style={{ padding: "3px 7px" }}
                        onClick={() => toggleDetalle(v.id)}
                      >
                        {ventaAbierta === v.id ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        #
                      </span>
                      <span className="fw-bold">{v.id}</span>
                    </td>
                    <td>
                      {v.cliente_nombre ? (
                        <span className="fw-semibold">{v.cliente_nombre}</span>
                      ) : (
                        <span className="text-muted fst-italic">-</span>
                      )}
                    </td>
                    <td>
                      {new Date(v.fecha).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          v.medio_pago === "efectivo"
                            ? "bg-success"
                            : v.medio_pago === "transferencia"
                              ? "bg-primary"
                              : "bg-warning text-dark"
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        {v.medio_pago === "efectivo"
                          ? "💵 Efectivo"
                          : v.medio_pago === "transferencia"
                            ? "📲 Transfer."
                            : "🔀 Mix"}
                      </span>
                    </td>
                    <td className="text-end fw-bold text-success">
                      ${Number(v.total).toLocaleString("es-AR")}
                      {v.medio_pago === "mix" && (
                        <div className="d-flex flex-column align-items-end gap-1 mt-1">
                          <span
                            className="badge bg-success bg-opacity-75"
                            style={{ fontSize: 10 }}
                          >
                            💵 $
                            {Number(v.monto_efectivo).toLocaleString("es-AR")}
                          </span>
                          <span
                            className="badge bg-primary bg-opacity-75"
                            style={{ fontSize: 10 }}
                          >
                            📲 $
                            {Number(v.monto_transferencia).toLocaleString(
                              "es-AR",
                            )}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>

                  {ventaAbierta === v.id && detalles[v.id] && (
                    <tr>
                      <td colSpan={5} style={{ padding: "0 14px 14px 58px" }}>
                        <div
                          className="card"
                          style={{ borderRadius: 10, overflow: "hidden" }}
                        >
                          <table
                            className="table table-sm mb-0"
                            style={{ fontSize: 13 }}
                          >
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th className="text-center">Cant.</th>
                                <th className="text-end">Precio</th>
                                <th className="text-end">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalles[v.id].detalles?.map((d, i) => (
                                <tr key={i}>
                                  <td className="fw-semibold">{d.nombre}</td>
                                  <td className="text-center">
                                    <span className="badge bg-secondary">
                                      {d.cantidad}
                                    </span>
                                  </td>
                                  <td className="text-end text-muted">
                                    ${d.precio.toLocaleString("es-AR")}
                                  </td>
                                  <td className="text-end fw-semibold">
                                    $
                                    {(d.precio * d.cantidad).toLocaleString(
                                      "es-AR",
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FacturacionDia;
