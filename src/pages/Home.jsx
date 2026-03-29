import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  FileText,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { PORT } from "../../backend/config";

// Devuelve "YYYY-MM-DD" en hora local, sin desfase UTC
const fechaHoy = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function Home() {
  const [alertaStock, setAlertaStock] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:${PORT}/productos/stock-bajo`)
      .then((res) => {
        if (!res.ok) throw new Error("Error en la respuesta");
        return res.json();
      })
      .then((data) => setAlertaStock(data))
      .catch((err) => console.error("Error cargando alerta:", err));
  }, []);

  const navItems = [
    {
      to: "/ventas/nueva",
      icon: <ShoppingCart size={22} />,
      label: "Nueva Venta",
      sub: "Registrar una transacción",
      iconBg: "bg-success bg-opacity-10",
      iconColor: "text-success",
    },
    {
      to: "/presupuestos",
      icon: <ClipboardList size={22} />,
      label: "Presupuestos",
      sub: "Ver, agregar, aceptar o eliminar presupuestos",
      iconStyle: { background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
    },
    {
      to: "/productos",
      icon: <Package size={22} />,
      label: "Productos",
      sub: "Ver, agregar o editar productos",
      iconBg: "bg-primary bg-opacity-10",
      iconColor: "text-primary",
    },
    {
      to: `/facturacion/${fechaHoy()}`,
      icon: <Receipt size={22} />,
      label: "Facturación del día",
      state: { backDir: "/" },
      sub: "Resumen de ventas de hoy",
      iconBg: "bg-warning bg-opacity-10",
      iconColor: "text-warning",
    },
    {
      to: "/facturacion/mes",
      icon: <TrendingUp size={22} />,
      label: "Facturación del mes",
      sub: "Ventas y estadísticas mensuales",
      iconBg: "bg-info bg-opacity-10",
      iconColor: "text-info",
    },
  ];

  return (
    <div className="d-flex flex-column align-items-center pt-5">
      {/* Encabezado */}
      <div className="text-center mb-4">
        <p
          className="text-muted mb-1"
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Sistema de gestión
        </p>
        <h1 className="fw-bold mb-0">Punta en Blanko</h1>
      </div>

      {/* Alerta de stock */}
      {alertaStock &&
        (alertaStock.stockBajo > 0 || alertaStock.sinStock > 0) && (
          <div
            className="d-flex flex-column gap-2 mb-4"
            style={{ width: "100%", maxWidth: "400px" }}
          >
            {alertaStock.sinStock > 0 && (
              <div
                className="d-flex align-items-center gap-3 px-3 py-2"
                style={{
                  borderRadius: 10,
                  background: "rgba(220, 53, 69, 0.08)",
                  border: "1px solid rgba(220, 53, 69, 0.25)",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>🔴</span>
                <div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "0.85rem", color: "#dc3545" }}
                  >
                    Sin stock
                  </p>
                  <p
                    className="mb-0 text-muted"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {alertaStock.sinStock} producto
                    {alertaStock.sinStock !== 1 ? "s" : ""} sin unidades
                    disponibles
                  </p>
                </div>
              </div>
            )}

            {alertaStock.stockBajo > 0 && (
              <div
                className="d-flex align-items-center gap-3 px-3 py-2"
                style={{
                  borderRadius: 10,
                  background: "rgba(255, 193, 7, 0.08)",
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>🟡</span>
                <div>
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "0.85rem", color: "#e6a817" }}
                  >
                    Stock bajo
                  </p>
                  <p
                    className="mb-0 text-muted"
                    style={{ fontSize: "0.78rem" }}
                  >
                    {alertaStock.stockBajo} producto
                    {alertaStock.stockBajo !== 1 ? "s" : ""} por debajo del
                    límite
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Navegación */}
      <div
        className="d-grid gap-3"
        style={{
          width: "100%",
          maxWidth: "820px",
          gridTemplateColumns: "repeat(2, 1fr)",
        }}
      >
        {navItems.map(
          ({ to, icon, label, sub, iconBg, iconColor, iconStyle, state }, index) => (
            <Link
              key={to}
              to={to}
              state={state}
              className="card text-decoration-none d-flex flex-row align-items-center gap-3 p-3"
              style={{
                borderRadius: "12px",
                ...(index === 0 ? { gridColumn: "1 / -1", justifyContent: "center" } : {}),
              }}
            >
              <div
                className={`d-flex align-items-center justify-content-center rounded-3 ${iconBg ?? ""} ${iconColor ?? ""}`}
                style={{
                  width: "44px",
                  height: "44px",
                  flexShrink: 0,
                  ...(iconStyle ?? {}),
                }}
              >
                {icon}
              </div>
              <div className="flex-grow-1">
                <p className="mb-0" style={{ fontSize: "0.95rem" }}>
                  {label}
                </p>
                <p className="mb-0 text-muted" style={{ fontSize: "0.78rem" }}>
                  {sub}
                </p>
              </div>
              <span className="text-muted">›</span>
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export default Home;