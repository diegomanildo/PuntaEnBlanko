import { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PORT } from "../../backend/config";
import { toast } from "react-toastify";

function NuevoProducto() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [errores, setErrores] = useState({});

  const guardarProducto = async () => {
    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!precio) nuevosErrores.precio = "El precio es obligatorio";
    if (!stock) nuevosErrores.stock = "El stock es obligatorio";

    setErrores(nuevosErrores);

    // si hay errores, no seguimos
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      const res = await fetch(`http://localhost:${PORT}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio, stock }),
      });

      const data = await res.json();
      toast.success(data.message || `Producto "${nombre}" creado`);

      if (res.ok) navigate("/productos");
    } catch (error) {
      toast.error("Error al guardar el producto: " + error.message);
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Nuevo Producto</h2>

      <div className="card p-4">
        <div className="mb-3">
          <label>Nombre</label>
          <input
            className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errores.nombre) {
                setErrores((prev) => ({ ...prev, nombre: null }));
              }
            }}
          />
          <small
            style={{ fontSize: "12px" }}
            className="text-muted d-block mt-1"
          >
            ⚠️ Los acentos y la letra ñ no funcionan correctamente apareceran
            como "?"
          </small>
          {errores.nombre && (
            <div className="invalid-feedback">{errores.nombre}</div>
          )}
        </div>

        <div className="mb-3">
          <label>Precio</label>
          <input
            type="number"
            className={`form-control ${errores.precio ? "is-invalid" : ""}`}
            value={precio}
            onChange={(e) => {
              setPrecio(e.target.value);
              if (errores.precio) {
                setErrores((prev) => ({ ...prev, precio: null }));
              }
            }}
          />
          {errores.precio && (
            <div className="invalid-feedback">{errores.precio}</div>
          )}
        </div>

        <div className="mb-3">
          <label>Stock</label>
          <input
            type="number"
            className={`form-control ${errores.stock ? "is-invalid" : ""}`}
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              if (errores.stock) {
                setErrores((prev) => ({ ...prev, stock: null }));
              }
            }}
          />
          {errores.stock && (
            <div className="invalid-feedback">{errores.stock}</div>
          )}
        </div>

        <div className="d-flex gap-3">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/productos")}
          >
            <ArrowLeft size={18} /> Volver
          </button>

          <button className="btn btn-success" onClick={guardarProducto}>
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default NuevoProducto;
