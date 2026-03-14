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

function Productos() {
  const [productos, setProductos] = useState([]);
  const [stockAlerta, setStockAlerta] = useState(0);
  const [nuevoStockAlerta, setNuevoStockAlerta] = useState(0);

  // Para ordenar
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
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">¿Seguro que querés eliminar este producto?</p>

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
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      },
    );
  };

  // Función para ordenar productos
  const ordenarPor = (columna) => {
    let direccion = "asc";
    if (orden.columna === columna && orden.direccion === "asc") {
      direccion = "desc";
    }

    const productosOrdenados = [...productos].sort((a, b) => {
      if (typeof a[columna] === "string") {
        return direccion === "asc"
          ? a[columna].localeCompare(b[columna])
          : b[columna].localeCompare(a[columna]);
      } else {
        return direccion === "asc"
          ? a[columna] - b[columna]
          : b[columna] - a[columna];
      }
    });

    setProductos(productosOrdenados);
    setOrden({ columna, direccion });
  };

  // Para mostrar el icono de orden
  const iconoOrden = (columna) => {
    if (orden.columna === columna) {
      return orden.direccion === "asc" ? "▲" : "▼";
    }
    return "";
  };

  if (productos.length === 0) {
    return (
      <div className="text-center mt-5">
        <h2 className="d-flex align-items-center justify-content-center gap-2">
          <Package /> Productos
        </h2>
        <p className="text-muted">No hay productos registrados</p>
        <Link
          className="btn btn-success d-flex align-items-center justify-content-center gap-2"
          to="/productos/nuevo"
        >
          <Plus size={18} /> Agregar producto
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h2 className="d-flex align-items-center gap-2">
          <Package /> Productos
        </h2>

        <div className="d-flex align-items-center gap-2">
          <small>Alerta de stock bajo: </small>
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: "70px" }}
            value={nuevoStockAlerta}
            onChange={(e) => setNuevoStockAlerta(e.target.value)}
          />
          <button className="btn btn-success btn-sm" onClick={guardarConfig}>
            <Save size={16} /> Guardar
          </button>
        </div>

        <Link
          className="btn btn-success d-flex align-items-center gap-2"
          to="/productos/nuevo"
        >
          <Plus size={18} /> Agregar producto
        </Link>
      </div>

      <div
        className="card p-3 shadow-sm"
        style={{ maxHeight: "720px", overflowY: "auto" }}
      >
        <table className="table mb-0">
          <thead>
            <tr>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => ordenarPor("nombre")}
              >
                Producto {iconoOrden("nombre")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => ordenarPor("precio")}
              >
                Precio {iconoOrden("precio")}
              </th>
              <th
                style={{ cursor: "pointer" }}
                onClick={() => ordenarPor("stock")}
              >
                Stock {iconoOrden("stock")}
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr
                key={producto.id}
                className={
                  producto.stock === 0
                    ? "table-danger"
                    : producto.stock <= stockAlerta
                      ? "table-warning"
                      : ""
                }
              >
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {producto.stock === 0 && (
                      <span className="badge bg-danger d-flex align-items-center gap-1">
                        <AlertTriangle size={14} /> SIN STOCK
                      </span>
                    )}
                    {producto.stock > 0 && producto.stock <= stockAlerta && (
                      <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
                        <AlertTriangle size={14} /> STOCK BAJO
                      </span>
                    )}
                    <span className="fw-semibold">{producto.nombre}</span>
                  </div>
                </td>
                <td>${producto.precio}</td>
                <td>{producto.stock}</td>
                <td className="align-middle d-flex gap-2">
                  <Link
                    to={`/productos/editar/${producto.id}`}
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                  >
                    <Pencil size={16} /> Editar
                  </Link>
                  <button
                    className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                    onClick={() => confirmarEliminar(producto.id)}
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
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
