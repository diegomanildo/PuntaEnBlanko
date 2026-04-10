import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Package, Save } from "lucide-react";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import { ColorPicker } from "../../components/ColorPicker";
import API_URL from "../../config";

function EditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [tieneStock, setTieneStock] = useState(true);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [color, setColor] = useState(null);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    const cargarProducto = async () => {
      const res = await fetch(`${API_URL}/productos/${id}`);
      const data = await res.json();

      setNombre(data.nombre);
      setPrecio(data.precio);
      setStock(data.stock);
      setTieneStock(data.tiene_stock === 1);
      setCodigoBarras(data.codigo_barras ?? "");
      setColor(data.color ?? null);
    };

    cargarProducto();
  }, [id]);

  const actualizarProducto = useCallback(async () => {
    const nuevosErrores = {};
    if (!nombre) nuevosErrores.nombre = "El nombre es obligatorio";
    if (!precio) nuevosErrores.precio = "El precio es obligatorio";
    if (tieneStock && (stock === undefined || stock === null || stock === ""))
      nuevosErrores.stock = "El stock es obligatorio";

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      const res = await fetch(`${API_URL}/productos/${id}`, {
        method: "PUT",
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

      if (res.ok) {
        toast.success(data.message || "Producto actualizado");
        navigate("/productos");
      } else {
        toast.error(data.message || "Error al actualizar el producto");
      }
    } catch (error) {
      toast.error("Error al actualizar el producto: " + error.message);
    }
  }, [nombre, precio, stock, tieneStock, codigoBarras, color, id, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") actualizarProducto();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nombre, precio, stock, tieneStock, codigoBarras, color, actualizarProducto]);

  return (
    <div className="container">
      <BackButton dir="/productos" />
      <h2 className="d-flex align-items-center gap-2 mb-4">
        <Package />
        Editar producto
      </h2>

      <div className="card p-4">
        {/* Código de barras */}
        <div className="mb-3">
          <label className="form-label">Código de barras</label>
          <input
            className="form-control"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            autoFocus
          />
          {codigoBarras === "" && (
            <small
              className="d-block mt-1 text-danger"
              style={{ fontSize: 12 }}
            >
              ⚠️ IMPORTANTE: Si no se carga el código de barras, el producto no
              se podrá escanear.
            </small>
          )}
        </div>

        {/* Nombre */}
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            className={`form-control ${errores.nombre ? "is-invalid" : ""}`}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              if (errores.nombre)
                setErrores((prev) => ({ ...prev, nombre: null }));
            }}
          />
          {errores.nombre ? (
            <div className="invalid-feedback">{errores.nombre}</div>
          ) : (
            <small className="text-muted d-block mt-1" style={{ fontSize: 12 }}>
              ⚠️ Los acentos y la letra ñ no funcionan correctamente, aparecerán
              como "?"
            </small>
          )}
        </div>

        {/* Precio */}
        <div className="mb-3">
          <label className="form-label">Precio</label>
          <input
            type="number"
            className={`form-control ${errores.precio ? "is-invalid" : ""}`}
            value={precio}
            onChange={(e) => {
              setPrecio(e.target.value);
              if (errores.precio)
                setErrores((prev) => ({ ...prev, precio: null }));
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
            <label className="form-label">Stock</label>
            <input
              type="number"
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

        {/* Color */}
        <div className="mb-3">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="d-flex gap-3">
          <button
            className="btn btn-success d-flex align-items-center gap-2"
            onClick={actualizarProducto}
          >
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditarProducto;
