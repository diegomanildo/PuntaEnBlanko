import { Link } from "react-router-dom";
import { ShoppingCart, Package, Receipt, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { PORT } from "../../backend/config";

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
      to: "/venta",
      icon: <ShoppingCart size={22} />,
      label: "Nueva Venta",
      sub: "Registrar una transacción",
      iconBg: "bg-success bg-opacity-10",
      iconColor: "text-success",
    },
    {
      to: "/productos",
      icon: <Package size={22} />,
      label: "Productos",
      sub: "Inventario y stock",
      iconBg: "bg-primary bg-opacity-10",
      iconColor: "text-primary",
    },
    {
      to: `/facturacion/${new Date().toISOString().split("T")[0]}`,
      icon: <Receipt size={22} />,
      label: "Facturación del día",
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
            className="alert alert-warning d-flex align-items-start gap-2 mb-4"
            style={{ width: "100%", maxWidth: "400px" }}
          >
            <span style={{ fontSize: "1.1rem", marginTop: "1px" }}>⚠️</span>
            <div>
              <p className="mb-0 fw-semibold" style={{ fontSize: "0.9rem" }}>
                Atención con el stock
              </p>
              <p className="mb-0" style={{ fontSize: "0.82rem" }}>
                {alertaStock.stockBajo > 0 &&
                  `${alertaStock.stockBajo} productos con stock bajo`}
                {alertaStock.stockBajo > 0 && alertaStock.sinStock > 0 && " · "}
                {alertaStock.sinStock > 0 &&
                  `${alertaStock.sinStock} sin stock`}
              </p>
            </div>
          </div>
        )}

      {/* Navegación */}
      <div
        className="d-flex flex-column gap-3"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        {navItems.map(({ to, icon, label, sub, iconBg, iconColor }) => (
          <Link
            key={to}
            to={to}
            className="card text-decoration-none d-flex flex-row align-items-center gap-3 p-3"
            style={{ borderRadius: "12px" }}
          >
            <div
              className={`d-flex align-items-center justify-content-center rounded-3 ${iconBg} ${iconColor}`}
              style={{ width: "44px", height: "44px", flexShrink: 0 }}
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
        ))}
      </div>
    </div>
  );
}

export default Home;
