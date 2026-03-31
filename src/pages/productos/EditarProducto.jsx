import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, Save } from "lucide-react";
import { PORT } from "../../../backend/config";
import { toast } from "react-toastify";
import BackButton from "../../components/UI/BackButton";
import { ColorPicker } from "../../components/UI/ColorPicker";

function EditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [tieneStock, setTieneStock] = useState(true);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [color, setColor] = useState(null);

  useEffect(() => {
    const cargarProducto = async () => {
      const res = await fetch(`http://localhost:${PORT}/productos/${id}`);
      const data = await res.json();

      setNombre(data.nombre);
      setPrecio(data.precio);
      setStock(data.stock);
      setTieneStock(data.tiene_stock === 1);
      setCodigoBarras(data.codigo_barras);
      setColor(data.color ?? null);
    };

    cargarProducto();
  }, [id]);

  const actualizarProducto = async () => {
    try {
      const res = await fetch(`http://localhost:${PORT}/productos/${id}`, {
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
  };

  return (
    <div className="container">
      <BackButton dir="/productos" />
      <h2 className="d-flex align-items-center gap-2 mb-4">
        <Package />
        Editar producto
      </h2>

      <div className="card p-4">
        <div className="mb-3">
          <label className="form-label">Codigo de barras</label>
          <input
            className="form-control"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
            autoFocus
          />
          {codigoBarras === "" && (
            <small
              style={{ fontSize: "12px" }}
              className="d-block mt-1 text-danger"
            >
              ⚠️ IMPORTANTE! Si no se carga el código de barras, el producto no se podrá escanear.
            </small>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <small
            style={{ fontSize: "12px" }}
            className="text-muted d-block mt-1"
          >
            ⚠️ Los acentos y la letra ñ no funcionan correctamente apareceran
            como "?"
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label">Precio</label>
          <input
            type="number"
            className="form-control"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
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
              className={`form-control`}
              value={stock}
              onChange={(e) => {
                setStock(e.target.value);
              }}
            />
          </div>
        )}

        <div className="mb-3">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="d-flex gap-3">
          <button className="btn btn-success" onClick={actualizarProducto}>
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditarProducto;
