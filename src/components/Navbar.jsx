import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Receipt,
  TrendingUp,
  ClipboardList,
  Sun,
  Moon,
  Users,
  HardDriveDownload,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import logo from "../assets/logo.png";

const fechaHoy = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Links principales: siempre visibles
const mainLinks = [
  { to: "/ventas/nueva", icon: ShoppingCart, label: "Nueva Venta" },
  { to: "/presupuestos", icon: ClipboardList, label: "Presupuestos" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/productos", icon: Package, label: "Productos" },
];

// Links secundarios: agrupados bajo "Reportes"
const reportLinks = [
  {
    to: `/facturacion/${fechaHoy()}`,
    icon: Receipt,
    label: "Facturación de hoy",
    state: { backDir: "/" },
  },
  { to: "/facturacion/mes", icon: TrendingUp, label: "Facturación del mes" },
  { to: "/backups", icon: HardDriveDownload, label: "Backups" },
];

function Navbar({ toggleTheme, theme }) {
  const location = useLocation();
  const [reportsOpen, setReportsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, right: "auto" });
  const toggleRef = useRef(null);
  const menuRef = useRef(null);

  // Calcular la posición del menú en base al botón
  const updateMenuPos = () => {
    if (!toggleRef.current) return;
    const rect = toggleRef.current.getBoundingClientRect();
    const menuWidth = 210;
    const overflowsRight = rect.left + menuWidth > window.innerWidth;

    setMenuPos({
      top: rect.bottom + 6,
      left: overflowsRight ? "auto" : rect.left,
      right: overflowsRight ? window.innerWidth - rect.right : "auto",
    });
  };

  useEffect(() => {
    if (!reportsOpen) return;

    updateMenuPos();

    const handleClickOutside = (e) => {
      if (
        toggleRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) {
        return;
      }
      setReportsOpen(false);
    };

    window.addEventListener("resize", updateMenuPos);
    window.addEventListener("scroll", updateMenuPos, true);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updateMenuPos);
      window.removeEventListener("scroll", updateMenuPos, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reportsOpen]);

  // Cerrar el dropdown al cambiar de ruta (ajuste de estado durante el render)
  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setReportsOpen(false);
  }

  const isActive = (to) =>
    location.pathname === to ||
    (to !== "/" && location.pathname.startsWith(to));

  const isReportsActive =
    location.pathname.startsWith("/facturacion") ||
    location.pathname.startsWith("/backups");

  return (
    <nav className="navbar navbar-expand-lg">
      <div
        className="container d-flex align-items-center"
        style={{ gap: "0.75rem" }}
      >
        {/* Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={logo}
            style={{ height: "30px", width: "auto" }}
            alt="logo"
          />
        </Link>

        {/* Separador */}
        <div className="navbar-separator" />

        {/* Links */}
        <div className="navbar-links navbar-nav d-flex flex-row align-items-center">
          {mainLinks.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                title={label}
                className={`nav-link d-flex align-items-center${active ? " active" : ""}`}
              >
                <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                <span className="nav-link-label">{label}</span>
              </Link>
            );
          })}

          {/* Dropdown de Reportes */}
          <div className="nav-dropdown">
            <button
              ref={toggleRef}
              type="button"
              title="Reportes"
              className={`nav-link nav-dropdown-toggle d-flex align-items-center${
                isReportsActive ? " active" : ""
              }`}
              onClick={() => setReportsOpen((o) => !o)}
              aria-expanded={reportsOpen}
            >
              <LayoutDashboard
                size={15}
                strokeWidth={isReportsActive ? 2.2 : 1.8}
              />
              <span className="nav-link-label">Reportes</span>
              <ChevronDown
                size={14}
                className="nav-dropdown-chevron"
                style={{
                  transform: reportsOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {reportsOpen &&
              createPortal(
                <div
                  ref={menuRef}
                  className="nav-dropdown-menu"
                  style={{
                    position: "fixed",
                    top: menuPos.top,
                    left: menuPos.left,
                    right: menuPos.right,
                  }}
                >
                  {reportLinks.map(({ to, icon: Icon, label, state }) => {
                    const active = isActive(to);
                    return (
                      <Link
                        key={to}
                        to={to}
                        state={state}
                        className={`nav-dropdown-item d-flex align-items-center${
                          active ? " active" : ""
                        }`}
                        onClick={() => setReportsOpen(false)}
                      >
                        <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </div>,
                document.body
              )}
          </div>
        </div>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          title={
            theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
          }
          style={{
            width: 46,
            height: 25,
            borderRadius: 999,
            border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
            background:
              theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
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
              transform:
                theme === "dark" ? "translateX(21px)" : "translateX(0px)",
              transition:
                "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {theme === "dark" ? (
              <Moon size={11} color="#1a1a1a" />
            ) : (
              <Sun size={11} color="#ffffff" />
            )}
          </div>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;