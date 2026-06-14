import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  ClipboardList,
  Users,
  ArrowRight,
  HardDriveDownload,
} from "lucide-react";
import { useEffect, useState } from "react";
import API_URL from "../config";

// Devuelve "YYYY-MM-DD" en hora local, sin desfase UTC
const fechaHoy = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

function Home() {
  const [alertaStock, setAlertaStock] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/productos/stock-bajo`)
      .then((res) => {
        if (!res.ok) throw new Error("Error en la respuesta");
        return res.json();
      })
      .then((data) => setAlertaStock(data))
      .catch((err) => console.error("Error cargando alerta:", err));
  }, []);

  const tarjetasDestacadas = [
    {
      to: "/productos",
      icon: <Package size={26} />,
      label: "Productos",
      sub: "Ver, agregar o editar productos",
      iconBg: "rgba(13, 110, 253, 0.12)",
      iconColor: "#0d6efd",
    },
    {
      to: "/presupuestos",
      icon: <ClipboardList size={26} />,
      label: "Presupuestos",
      sub: "Ver, agregar, aceptar o eliminar presupuestos",
      iconBg: "rgba(99, 102, 241, 0.12)",
      iconColor: "#6366f1",
    },
  ];

  const accesosSecundarios = [
    {
      to: "/clientes",
      icon: <Users size={24} />,
      label: "Clientes",
      iconStyle: { background: "rgba(249, 115, 22, 0.12)", color: "#f97316" },
    },
    {
      to: `/facturacion/${fechaHoy()}`,
      icon: <Receipt size={24} />,
      label: "Facturación del día",
      state: { backDir: "/" },
      iconBg: "bg-warning bg-opacity-10",
      iconColor: "text-warning",
    },
    {
      to: "/facturacion/mes",
      icon: <TrendingUp size={24} />,
      label: "Facturación del mes",
      iconBg: "bg-info bg-opacity-10",
      iconColor: "text-info",
    },
    {
      to: "/backups",
      icon: <HardDriveDownload size={24} />,
      label: "Copias de seguridad",
      iconStyle: { background: "rgba(25, 135, 84, 0.12)", color: "#198754" },
    },
  ];

  return (
    <div className="d-flex flex-column align-items-center pt-4">
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
          {saludo()} · Sistema de gestión
        </p>
        <h1 className="fw-bold mb-0">Punta en Blanko</h1>
      </div>

      {/* Alerta de stock */}
      {alertaStock &&
        (alertaStock.stockBajo > 0 || alertaStock.sinStock > 0) && (
          <div
            className="d-flex flex-column gap-2 mb-4"
            style={{ width: "100%", maxWidth: "820px" }}
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

      {/* Bento grid */}
      <div style={{ width: "100%", maxWidth: "820px" }}>
        {/* Acción principal */}
        <Link
          to="/ventas/nueva"
          className="text-decoration-none d-flex align-items-center justify-content-between p-4 mb-3 home-hero"
          style={{ borderRadius: 16 }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: 56,
                height: 56,
                flexShrink: 0,
                background: "rgba(255,255,255,0.18)",
                color: "#fff",
              }}
            >
              <ShoppingCart size={28} />
            </div>
            <div>
              <p
                className="mb-0 fw-bold text-white"
                style={{ fontSize: "1.25rem" }}
              >
                Nueva Venta
              </p>
              <p
                className="mb-0"
                style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.85)" }}
              >
                Registrar una transacción
              </p>
            </div>
          </div>
          <ArrowRight size={22} className="text-white home-hero-arrow" />
        </Link>

        {/* Tarjetas destacadas: Productos y Presupuestos */}
        <div className="d-flex flex-column gap-3 mb-3">
          {tarjetasDestacadas.map(
            ({ to, icon, label, sub, iconBg, iconColor }) => (
              <Link
                key={to}
                to={to}
                className="card text-decoration-none d-flex flex-row align-items-center gap-3 p-3 home-card-feature"
                style={{ borderRadius: 14 }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{
                    width: 50,
                    height: 50,
                    flexShrink: 0,
                    background: iconBg,
                    color: iconColor,
                  }}
                >
                  {icon}
                </div>
                <div className="flex-grow-1">
                  <p
                    className="mb-0 fw-semibold"
                    style={{ fontSize: "1.05rem" }}
                  >
                    {label}
                  </p>
                  <p className="mb-0 text-muted" style={{ fontSize: "0.8rem" }}>
                    {sub}
                  </p>
                </div>
                <span className="text-muted home-card-arrow">›</span>
              </Link>
            ),
          )}
        </div>

        {/* Accesos secundarios */}
        <div
          className="d-grid gap-3"
          style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
        >
          {accesosSecundarios.map(
            ({ to, icon, label, iconBg, iconColor, iconStyle, state }) => (
              <Link
                key={to}
                to={to}
                state={state}
                className="card text-decoration-none d-flex flex-column align-items-center text-center gap-2 p-3 home-card-mini"
                style={{ borderRadius: 14 }}
              >
                <div
                  className={`d-flex align-items-center justify-content-center rounded-3 ${iconBg ?? ""} ${iconColor ?? ""}`}
                  style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    ...(iconStyle ?? {}),
                  }}
                >
                  {icon}
                </div>
                <p
                  className="mb-0"
                  style={{ fontSize: "0.82rem", lineHeight: 1.3 }}
                >
                  {label}
                </p>
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
