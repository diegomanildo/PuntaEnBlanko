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
            className="btn btn-sm btn-outline-secondary ms-3"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
