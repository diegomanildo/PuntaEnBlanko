import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  ClipboardList,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../assets/logo.png";

const fechaHoy = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const navLinks = [
  { to: "/ventas/nueva", icon: ShoppingCart, label: "Nueva Venta" },
  { to: "/presupuestos", icon: ClipboardList, label: "Presupuestos" },
  { to: "/productos", icon: Package, label: "Productos" },
  { to: `/facturacion/${fechaHoy()}`, icon: Receipt, label: "Hoy", state: { backDir: "/" } },
  { to: "/facturacion/mes", icon: TrendingUp, label: "Este mes" },
];

function Navbar({ toggleTheme, theme }) {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg">
      <div
        className="container d-flex align-items-center"
        style={{ gap: "0.75rem" }}
      >
        {/* Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} style={{ height: "30px", width: "auto" }} alt="logo" />
        </Link>

        {/* Separador */}
        <div
          style={{
            width: 1,
            height: 20,
            background: theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
            flexShrink: 0,
          }}
        />

        {/* Links */}
        <div className="navbar-nav d-flex flex-row align-items-center flex-wrap" style={{ gap: "2px", flex: 1 }}>
          {/* eslint-disable-next-line no-unused-vars */}
          {navLinks.map(({ to, icon: Icon, label, state }) => {
            const isActive =
              location.pathname === to ||
              (to !== "/" && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                state={state}
                className="nav-link d-flex align-items-center"
                style={{
                  gap: "6px",
                  fontSize: "0.83rem",
                  fontWeight: isActive ? 600 : 400,
                  borderRadius: "8px",
                  padding: "5px 10px",
                  background: isActive
                    ? theme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)"
                    : "transparent",
                  opacity: isActive ? 1 : 0.75,
                  transition: "background 0.2s ease, opacity 0.2s ease",
                }}
              >
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          style={{
            width: 46,
            height: 25,
            borderRadius: 999,
            border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
            background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "3px",
            flexShrink: 0,
            marginLeft: "0.25rem",
          }}
        >
          <div
            style={{
              width: 19,
              height: 19,
              borderRadius: "50%",
              background: theme === "dark" ? "#ffffff" : "#1a1a1a",
              transform: theme === "dark" ? "translateX(21px)" : "translateX(0px)",
              transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {theme === "dark"
              ? <Moon size={11} color="#1a1a1a" />
              : <Sun size={11} color="#ffffff" />
            }
          </div>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;