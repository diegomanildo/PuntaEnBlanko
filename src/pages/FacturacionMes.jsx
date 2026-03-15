import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PORT } from "../../backend/config";
import { BarChart3, TrendingUp, ShoppingBag, Star } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
    const [yyyy, mm, dd] = dia.split("-");
    const fecha = new Date(yyyy, mm - 1, dd);
    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
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

  const chartData = datos
    ? {
        labels: datos.porDia.map((d) => {
          const [yyyy, mm, dd] = d.dia.split("-");
          const fecha = new Date(yyyy, mm - 1, dd);
          return fecha.toLocaleDateString("es-AR", {
            day: "numeric",
            month: "short",
          });
        }),
        datasets: [
          {
            label: "Total del día",
            data: datos.porDia.map((d) => d.total),
            backgroundColor: datos.porDia.map((_, i) => {
              const colores = [
                "rgba(0, 180, 90, 0.5)",
                "rgba(79, 158, 255, 0.5)",
                "rgba(245, 158, 11, 0.5)",
                "rgba(239, 68, 68, 0.5)",
                "rgba(168, 85, 247, 0.5)",
                "rgba(20, 184, 166, 0.5)",
                "rgba(249, 115, 22, 0.5)",
                "rgba(236, 72, 153, 0.5)",
                "rgba(234, 179, 8, 0.5)",
                "rgba(6, 182, 212, 0.5)",
                "rgba(16, 185, 129, 0.5)",
                "rgba(99, 102, 241, 0.5)",
                "rgba(244, 63, 94, 0.5)",
                "rgba(251, 146, 60, 0.5)",
                "rgba(52, 211, 153, 0.5)",
                "rgba(129, 140, 248, 0.5)",
                "rgba(251, 113, 133, 0.5)",
                "rgba(34, 211, 238, 0.5)",
                "rgba(163, 230, 53, 0.5)",
                "rgba(232, 121, 249, 0.5)",
                "rgba(45, 212, 191, 0.5)",
                "rgba(251, 191, 36, 0.5)",
                "rgba(248, 113, 113, 0.5)",
                "rgba(96, 165, 250, 0.5)",
                "rgba(74, 222, 128, 0.5)",
                "rgba(167, 139, 250, 0.5)",
                "rgba(249, 168, 212, 0.5)",
                "rgba(103, 232, 249, 0.5)",
                "rgba(190, 242, 100, 0.5)",
                "rgba(217, 70, 239, 0.5)",
                "rgba(0, 150, 136, 0.5)",
              ];
              return colores[i % colores.length];
            }),
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => "$" + Number(context.raw).toLocaleString("es-AR"),
        },
      },
    },
    scales: {
      x: { grid: { display: true } },
      y: {
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        ticks: {
          callback: (v) => "$" + v.toLocaleString("es-AR"),
        },
      },
    },
  };

  return (
    <div>
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

          {/* Gráfico */}
          {chartData && datos.porDia.length > 0 && (
            <div className="card p-4 mb-4" style={{ borderRadius: 12 }}>
              <p
                className="text-muted mb-3"
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Ventas por día
              </p>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}

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
                      <td
                        className="fw-semibold"
                        style={{ textTransform: "capitalize" }}
                      >
                        {formatearFecha(d.dia)}
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
                          onClick={() => navigate(`/facturacion/${d.dia}`)}
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
