import { useEffect, useRef, useState, useCallback } from "react";
import { Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import { ColorPicker } from "../../components/ColorPicker";
import API_URL from "../../config";
import { bloquearNoNumerico } from "../../utils/inputUtils";

function NuevoProducto() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [tieneStock, setTieneStock] = useState(true);
  const [errores, setErrores] = useState({});
  const [codigoBarras, setCodigoBarras] = useState("");
  const codigoRef = useRef(null);
  const [color, setColor] = useState(null);

  useEffect(() => {
    codigoRef.current?.focus(); // foco inicial en el campo de escaneo
  }, []);

  const guardarProducto = useCallback(async () => {
    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!precio) nuevosErrores.precio = "El precio es obligatorio";
    if (tieneStock && !stock) nuevosErrores.stock = "El stock es obligatorio";

    setErrores(nuevosErrores);

    // si hay errores, no seguimos
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      const res = await fetch(`${API_URL}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          precio,
          stock,
          tiene_stock: tieneStock,
          codigo_barras: codigoBarras,
          color,
        }),
      });

      const data = await res.json();
      toast.success(data.message || `Producto "${nombre}" creado`);

      if (res.ok) navigate("/productos");
    } catch (error) {
      toast.error("Error al guardar el producto: " + error.message);
    }
  }, [nombre, precio, stock, tieneStock, codigoBarras, color, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") guardarProducto();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nombre, precio, stock, tieneStock, codigoBarras, color, guardarProducto]);

  return (
    <div className="container">
      <BackButton dir="/productos" />

      <h2 className="mb-4">Nuevo Producto</h2>

      <div className="card p-4">
        <div className="mb-3">
          <label>Codigo de barras</label>
          <input
            ref={codigoRef}
            className={`form-control ${errores.codigoBarras ? "is-invalid" : ""}`}
            value={codigoBarras}
            onChange={(e) => {
              setCodigoBarras(e.target.value);
              if (errores.codigoBarras) {
                setErrores((prev) => ({ ...prev, codigoBarras: null }));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />
          {codigoBarras === "" && (
            <small
              style={{ fontSize: "12px" }}
              className="d-block mt-1 text-warning fw-semibold"
            >
              ⚠️ IMPORTANTE! Si no se carga el código de barras, el producto no se podrá escanear.
            </small>
          )}
        </div>
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
          {errores.nombre && (
            <div className="invalid-feedback">{errores.nombre}</div>
          )}
          <small
            style={{ fontSize: "12px" }}
            className="d-block mt-1 text-warning fw-semibold"
          >
            ⚠️ Los acentos y la letra ñ no funcionan correctamente apareceran
            como "?"
          </small>
        </div>

        <div className="mb-3">
          <label>Precio</label>
          <input
            type="number"
            onKeyDown={bloquearNoNumerico}
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

        {/* Toggle tiene stock */}
        <div className="mb-3">
          <label className="form-label">Manejo de stock</label>
          <div className="d-flex gap-2">
            <button
              type="button"
              className={`btn btn-sm ${tieneStock ? "btn-success" : "btn-outline-success"}`}
              onClick={() => setTieneStock(true)}
            >
              ✓ Con stock
            </button>
            <button
              type="button"
              className={`btn btn-sm ${!tieneStock ? "btn-secondary" : "btn-outline-secondary"}`}
              onClick={() => setTieneStock(false)}
            >
              — Sin manejo de stock
            </button>
          </div>
        </div>

        {/* Campo stock: solo si tiene_stock */}
        {tieneStock && (
          <div className="mb-3">
            <label>Stock</label>
            <input
              type="number"
              onKeyDown={bloquearNoNumerico}
              className={`form-control ${errores.stock ? "is-invalid" : ""}`}
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
                if (errores.stock)
                  setErrores((prev) => ({ ...prev, stock: null }));
              }}
            />
            {errores.stock && (
              <div className="invalid-feedback">{errores.stock}</div>
            )}
          </div>
        )}
        
        <div className="mb-3">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="d-flex gap-3">
          <button className="btn btn-success" onClick={guardarProducto}>
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default NuevoProducto;
