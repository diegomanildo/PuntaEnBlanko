import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PORT } from "../../backend/config";
import { BarChart3, TrendingUp, Star } from "lucide-react";
import GraficoVentasMes from "../components/GraficoVentasMes";
import BackButton from "../components/UI/BackButton";

function FacturacionMes() {
  const [datos, setDatos] = useState(null);
  const navigate = useNavigate();

  const [orden, setOrden] = useState({ columna: null, direccion: "asc" });

  const ordenarPor = (columna) => {
    const direccion =
      orden.columna === columna && orden.direccion === "asc" ? "desc" : "asc";
    setOrden({ columna, direccion });
  };

  const iconoOrden = (columna) => {
    if (orden.columna !== columna)
      return <span style={{ opacity: 0.3 }}>↕</span>;
    return orden.direccion === "asc" ? "▲" : "▼";
  };

  const porDiaOrdenado = datos
    ? [...datos.porDia].sort((a, b) => {
        const dir = orden.direccion === "asc" ? 1 : -1;
        if (orden.columna === "fecha") return a.dia > b.dia ? dir : -dir;
        if (orden.columna === "cantidad")
          return (a.cantidad - b.cantidad) * dir;
        if (orden.columna === "total") return (a.total - b.total) * dir;
        return 0;
      })
    : [];

  const formatearFecha = (dia) => {
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    const [yyyy, mm, dd] = dia.split("-");
    const fecha = new Date(yyyy, mm - 1, dd);
    const fechaFormateada = fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (dia === hoyStr)
      return (
        <>
          {fechaFormateada}{" "}
          <span className="badge bg-info" style={{ fontSize: "0.65rem" }}>
            Hoy
          </span>
        </>
      );
    return fechaFormateada;
  };

  useEffect(() => {
    fetch(`http://localhost:${PORT}/ventas/mes`)
      .then((r) => r.json())
      .then(setDatos);
  }, []);

  const fechaMes = new Date().toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const ticketPromedio =
    datos && datos.cantidadVentas > 0
      ? Math.round(datos.total / datos.cantidadVentas)
      : 0;

  return (
    <div>
      <BackButton dir="/" />
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 bg-warning bg-opacity-10"
          style={{ width: 42, height: 42, flexShrink: 0 }}
        >
          <BarChart3 size={20} className="text-warning" />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
            Historial del mes
          </h2>
          <small className="text-muted" style={{ textTransform: "capitalize" }}>
            {fechaMes}
          </small>
        </div>
      </div>

      {!datos ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <>
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
                  Total del mes
                </p>
                <p
                  className="text-success fw-bold mb-0"
                  style={{ fontSize: "1.7rem", lineHeight: 1.1 }}
                >
                  ${datos.total.toLocaleString("es-AR")}
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
                  Ventas totales
                </p>
                <p
                  className="fw-bold mb-0"
                  style={{ fontSize: "1.7rem", lineHeight: 1.1 }}
                >
                  {datos.cantidadVentas}
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
                  Ticket promedio
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

          {/* Producto más vendido */}
          {datos.topProductos && datos.topProductos.length > 0 && (
            <div className="card p-3 mb-4" style={{ borderRadius: 12 }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-3 bg-warning bg-opacity-10"
                  style={{ width: 48, height: 48, flexShrink: 0 }}
                >
                  <Star size={22} className="text-warning" />
                </div>
                <p
                  className="text-muted mb-0"
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  Productos más vendidos del mes
                </p>
              </div>

              <div className="d-flex flex-column gap-2">
                {datos.topProductos.map((p, i) => (
                  <div
                    key={p.nombre}
                    className="d-flex align-items-center gap-3"
                  >
                    <span
                      className="fw-bold d-flex align-items-center justify-content-center rounded-2"
                      style={{
                        width: 28,
                        height: 28,
                        fontSize: 13,
                        flexShrink: 0,
                        background:
                          i === 0
                            ? "rgba(245,158,11,0.15)"
                            : i === 1
                              ? "rgba(148,163,184,0.15)"
                              : "rgba(180,120,60,0.15)",
                        color:
                          i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#b47c3c",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="fw-semibold flex-grow-1">{p.nombre}</span>
                    <span className="text-muted" style={{ fontSize: 13 }}>
                      {p.total_vendido} unidades
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {datos.porDia.length > 0 && <GraficoVentasMes porDia={datos.porDia} />}

          {/* Historial por día */}
          <div
            className="card shadow-sm mb-5"
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <table className="table mb-0">
              <thead>
                <tr>
                  {[
                    ["fecha", "Fecha"],
                    ["cantidad", "Ventas"],
                    ["total", "Total"],
                  ].map(([col, label]) => (
                    <th
                      key={col}
                      onClick={() => ordenarPor(col)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <span className="d-flex align-items-center gap-1">
                        {label}{" "}
                        <span style={{ fontSize: 11 }}>{iconoOrden(col)}</span>
                      </span>
                    </th>
                  ))}
                  <th>Ver detalle</th>
                </tr>
              </thead>
              <tbody>
                {porDiaOrdenado.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <TrendingUp
                        size={36}
                        strokeWidth={1.2}
                        className="text-muted mb-3 d-block mx-auto"
                      />
                      <p className="text-muted mb-0">No hay ventas este mes</p>
                    </td>
                  </tr>
                ) : (
                  porDiaOrdenado.map((d) => (
                    <tr key={d.dia}>
                      <td className="fw-semibold">
                        <span style={{ textTransform: "capitalize" }}>
                          {formatearFecha(d.dia)}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{d.cantidad}</span>
                      </td>
                      <td className="fw-bold text-success">
                        ${Number(d.total).toLocaleString("es-AR")}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                          onClick={() => navigate(`/facturacion/${d.dia}`, { state: { backDir: "/facturacion/mes" } })}
                        >
                          Ver →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default FacturacionMes;