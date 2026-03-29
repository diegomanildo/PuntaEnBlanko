/* eslint-disable react-hooks/set-state-in-effect */
import { Link } from "react-router-dom";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
import { PORT } from "../../backend/config";
import { toast } from "react-toastify";
import BackButton from "../components/UI/BackButton";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [stockAlerta, setStockAlerta] = useState(0);
  const [nuevoStockAlerta, setNuevoStockAlerta] = useState(0);
  const [orden, setOrden] = useState({ columna: null, direccion: "asc" });

  const cargarProductos = async () => {
    const res = await fetch(`http://localhost:${PORT}/productos`);
    const data = await res.json();
    setProductos(data);
  };

  const cargarConfig = async () => {
    const res = await fetch(`http://localhost:${PORT}/productos/config`);
    const data = await res.json();
    setStockAlerta(data.stock_alerta);
    setNuevoStockAlerta(data.stock_alerta);
  };

  useEffect(() => {
    cargarProductos();
    cargarConfig();
  }, []);

  const guardarConfig = async () => {
    try {
      const res = await fetch(`http://localhost:${PORT}/productos/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock_alerta: nuevoStockAlerta }),
      });
      const data = await res.json();
      toast.success(data.message || "Configuración guardada");
      setStockAlerta(nuevoStockAlerta);
    } catch (error) {
      toast.error("Error al guardar la configuración: " + error.message);
    }
  };

  const eliminarProducto = async (id) => {
    try {
      const res = await fetch(`http://localhost:${PORT}/productos/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      toast.success(data.message || "Producto eliminado");
      cargarProductos();
    } catch (error) {
      toast.error("Error al eliminar el producto: " + error.message);
    }
  };

  const confirmarEliminar = (id) => {
    const toastId = `eliminar-${id}`;
    if (toast.isActive(toastId)) return;

    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">
            ¿Seguro que querés eliminar el producto{" "}
            <strong>"{productos.find((p) => p.id === id).nombre}"</strong>?
          </p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                eliminarProducto(id);
                closeToast();
              }}
            >
              Eliminar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={closeToast}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { toastId, autoClose: false, closeOnClick: false, draggable: false },
    );
  };

  const ordenarPor = (columna) => {
    const direccion =
      orden.columna === columna && orden.direccion === "asc" ? "desc" : "asc";
    const productosOrdenados = [...productos].sort((a, b) =>
      typeof a[columna] === "string"
        ? direccion === "asc"
          ? a[columna].localeCompare(b[columna])
          : b[columna].localeCompare(a[columna])
        : direccion === "asc"
          ? a[columna] - b[columna]
          : b[columna] - a[columna],
    );
    setProductos(productosOrdenados);
    setOrden({ columna, direccion });
  };

  const iconoOrden = (columna) => {
    if (orden.columna !== columna)
      return <span style={{ opacity: 0.3 }}>↕</span>;
    return orden.direccion === "asc" ? "▲" : "▼";
  };

  const stockColor = (stock) => {
    if (stock === 0) return "text-danger fw-bold";
    if (stock <= stockAlerta) return "text-warning fw-bold";
    return "text-success fw-bold";
  };

  if (productos.length === 0) {
    return (
      <div className="container">
        <BackButton dir="/" />
        <div className="text-center mt-5">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 mb-3"
            style={{ width: 56, height: 56 }}
          >
            <Package size={26} className="text-primary" />
          </div>
          <h2 className="fw-bold mb-1">Productos</h2>
          <p className="text-muted mb-4">No hay productos registrados</p>
          <Link
            className="btn btn-success d-inline-flex align-items-center gap-2"
            to="/productos/nuevo"
          >
            <Plus size={18} /> Agregar producto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackButton dir="/" />
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10"
            style={{ width: 42, height: 42, flexShrink: 0 }}
          >
            <Package size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
              Productos
            </h2>
            
            <small className="text-muted">
              {productos.length} producto
              {productos.length !== 1 ? "s" : ""} registrado
              {productos.length !== 1 ? "s" : ""}
            </small>
          </div>
        </div>

        {/* Config alerta */}
        <div
          className="d-flex align-items-center gap-2 px-3 py-2"
          style={{
            borderRadius: 10,
            flexWrap: "nowrap",
            flexDirection: "row",
            border: "1px solid var(--bs-border-color)",
          }}
        >
          <AlertTriangle size={14} className="text-warning" />
          <small className="text-muted">Alerta stock bajo:</small>
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: 60, textAlign: "center" }}
            value={nuevoStockAlerta}
            onChange={(e) => setNuevoStockAlerta(e.target.value)}
          />
          <button
            className="btn btn-success btn-sm d-flex align-items-center gap-1"
            onClick={guardarConfig}
          >
            <Save size={13} /> Guardar
          </button>
        </div>

        <Link
          className="btn btn-success d-flex align-items-center gap-2"
          to="/productos/nuevo"
        >
          <Plus size={16} /> Agregar producto
        </Link>
      </div>

      {/* Tabla */}
      <div
        className="card shadow-sm"
        style={{
          borderRadius: 12,
          overflow: "hidden",
          maxHeight: 620,
          overflowY: "auto",
        }}
      >
        <table className="table mb-0">
          <thead>
            <tr>
              {[
                ["nombre", "Producto"],
                ["precio", "Precio"],
                ["stock", "Stock"],
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr
                key={producto.id}
                className={
                  producto.tiene_stock === 0
                    ? ""
                    : producto.stock === 0
                      ? "table-danger"
                      : producto.stock <= stockAlerta
                        ? "table-warning"
                        : ""
                }
              >
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {producto.tiene_stock !== 0 && producto.stock === 0 && (
                      <span className="badge bg-danger d-flex align-items-center gap-1">
                        <AlertTriangle size={11} /> SIN STOCK
                      </span>
                    )}
                    {producto.tiene_stock !== 0 &&
                      producto.stock > 0 &&
                      producto.stock <= stockAlerta && (
                        <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
                          <AlertTriangle size={11} /> STOCK BAJO
                        </span>
                      )}
                    <span className="fw-semibold">{producto.nombre}</span>
                  </div>
                </td>
                <td className="fw-bold text-success">
                  ${producto.precio.toLocaleString("es-AR")}
                </td>
                <td>
                  {producto.tiene_stock === 0 ? (
                    <span className="text-muted fw-bold">
                      Sin manejo de stock
                    </span>
                  ) : (
                    <span className={stockColor(producto.stock)}>
                      {producto.stock}
                    </span>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/productos/editar/${producto.id}`}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <Pencil size={13} /> Editar
                    </Link>
                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                      onClick={() => confirmarEliminar(producto.id)}
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Productos;
