import { Link } from "react-router-dom";
import { ShoppingCart, Package, BarChart3, Sun, Moon } from "lucide-react";
import logo from "../assets/logo.png";

function Navbar({ toggleTheme, theme }) {
  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img
            src={logo}
            style={{ width: "100px", marginBottom: "5px" }}
            className="img-fluid"
          />
        </Link>

        <div className="navbar-nav d-flex align-items-center gap-2">
          <Link className="nav-link" to="/venta">
            <ShoppingCart size={18} /> Nueva Venta
          </Link>

          <Link className="nav-link" to="/productos">
            <Package size={18} /> Productos
          </Link>

          <Link className="nav-link" to="/facturacion">
            <BarChart3 size={18} /> Facturación
          </Link>

          <button
            onClick={toggleTheme}
            title={
              theme === "dark"
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro"
            }
            style={{
              width: 48,
              height: 26,
              borderRadius: 99,
              border: "1px solid rgba(128,128,128,0.35)",
              background:
                theme === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "3px 4px",
              transition: "background 0.3s ease",
              marginLeft: "1rem",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: theme === "dark" ? "#ffffff" : "#1a1a1a",
                transform:
                  theme === "dark" ? "translateX(22px)" : "translateX(0px)",
                transition: "transform 0.3s ease, background 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {theme === "dark" ? (
                <Moon size={12} color="#1a1a1a" />
              ) : (
                <Sun size={12} color="#ffffff" />
              )}
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
