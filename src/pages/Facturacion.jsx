import { useEffect, useState } from "react";
import { PORT } from "../../backend/config";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";

function Facturacion() {
  const [ventas, setVentas] = useState([]);
  const [total, setTotal] = useState(0);
  const [detalles, setDetalles] = useState({});
  const [ventaAbierta, setVentaAbierta] = useState(null);
  const [orden, setOrden] = useState({ columna: null, direccion: "asc" });

  const cargarVentas = async () => {
    const res = await fetch(`http://localhost:${PORT}/ventas/hoy`);
    const data = await res.json();
    setVentas(data.ventas);
    setTotal(data.total);
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const toggleDetalle = async (id) => {
    if (ventaAbierta === id) { setVentaAbierta(null); return; }
    if (!detalles[id]) {
      const res = await fetch(`http://localhost:${PORT}/ventas/${id}`);
      const data = await res.json();
      setDetalles({ ...detalles, [id]: data });
    }
    setVentaAbierta(id);
  };

  const ordenarPor = (columna) => {
    const direccion = orden.columna === columna && orden.direccion === "asc" ? "desc" : "asc";
    const ventasOrdenadas = [...ventas].sort((a, b) => {
      if (columna === "fecha")
        return direccion === "asc" ? new Date(a.fecha) - new Date(b.fecha) : new Date(b.fecha) - new Date(a.fecha);
      return direccion === "asc" ? a[columna] - b[columna] : b[columna] - a[columna];
    });
    setVentas(ventasOrdenadas);
    setOrden({ columna, direccion });
  };

  const iconoOrden = (columna) => {
    if (orden.columna !== columna) return <span style={{ opacity: 0.3 }}>↕</span>;
    return orden.direccion === "asc" ? "▲" : "▼";
  };

  const ticketPromedio = ventas.length > 0 ? Math.round(total / ventas.length) : 0;

  const fechaHoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 bg-warning bg-opacity-10"
          style={{ width: 42, height: 42, flexShrink: 0 }}
        >
          <Receipt size={20} className="text-warning" />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>Facturación del día</h2>
          <small className="text-muted" style={{ textTransform: "capitalize" }}>{fechaHoy}</small>
        </div>
      </div>

      {/* Stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-1" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Total facturado
            </p>
            <p className="text-success fw-bold mb-0" style={{ fontSize: "1.7rem", lineHeight: 1.1 }}>
              ${total.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-1" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Ventas
            </p>
            <p className="fw-bold mb-0" style={{ fontSize: "1.7rem", lineHeight: 1.1 }}>
              {ventas.length}
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-1" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Ticket promedio
            </p>
            <p className="text-primary fw-bold mb-0" style={{ fontSize: "1.7rem", lineHeight: 1.1 }}>
              ${ticketPromedio.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      {ventas.length === 0 ? (
        <div className="card p-5 text-center" style={{ borderRadius: 12 }}>
          <Receipt size={36} strokeWidth={1.2} className="text-muted mx-auto mb-3" />
          <p className="text-muted mb-0">No hay ventas registradas hoy</p>
        </div>
      ) : (
        <div className="card" style={{ borderRadius: 12, overflow: "hidden" }}>
          <table className="table mb-0">
            <thead>
              <tr>
                <th style={{ width: 44 }}></th>
                {[["id", "ID"], ["fecha", "Hora"], ["total", "Total"]].map(([col, label]) => (
                  <th
                    key={col}
                    onClick={() => ordenarPor(col)}
                    style={{ cursor: "pointer", userSelect: "none", textAlign: col === "total" ? "right" : "left" }}
                  >
                    <span className="d-inline-flex align-items-center gap-1">
                      {label} <span style={{ fontSize: 11 }}>{iconoOrden(col)}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <>
                  <tr
                    key={v.id}
                    style={{ background: ventaAbierta === v.id ? "var(--bs-success-bg-subtle)" : undefined }}
                  >
                    <td>
                      <button
                        className={`btn btn-sm ${ventaAbierta === v.id ? "btn-success" : "btn-outline-secondary"} d-flex align-items-center`}
                        style={{ padding: "3px 7px" }}
                        onClick={() => toggleDetalle(v.id)}
                      >
                        {ventaAbierta === v.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                    <td>
                      <span className="text-muted" style={{ fontSize: 12 }}>#</span>
                      <span className="fw-bold">{v.id}</span>
                    </td>
                    <td>
                      {new Date(v.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="text-end fw-bold text-success">
                      ${v.total.toLocaleString("es-AR")}
                    </td>
                  </tr>

                  {ventaAbierta === v.id && detalles[v.id] && (
                    <tr key={`detalle-${v.id}`}>
                      <td colSpan={4} style={{ padding: "0 14px 14px 58px" }}>
                        <div className="card" style={{ borderRadius: 10, overflow: "hidden" }}>
                          <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th className="text-center">Cant.</th>
                                <th className="text-end">Precio</th>
                                <th className="text-end">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {detalles[v.id].map((d, i) => (
                                <tr key={i}>
                                  <td className="fw-semibold">{d.nombre}</td>
                                  <td className="text-center">
                                    <span className="badge bg-secondary">{d.cantidad}</span>
                                  </td>
                                  <td className="text-end text-muted">
                                    ${d.precio.toLocaleString("es-AR")}
                                  </td>
                                  <td className="text-end fw-semibold">
                                    ${(d.precio * d.cantidad).toLocaleString("es-AR")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Facturacion;