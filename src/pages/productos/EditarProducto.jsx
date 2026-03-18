import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, Save } from "lucide-react";
import { PORT } from "../../../backend/config";
import { toast } from "react-toastify";

function EditarProducto() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [tieneStock, setTieneStock] = useState(true);

  useEffect(() => {
    const cargarProducto = async () => {
      const res = await fetch(`http://localhost:${PORT}/productos/${id}`);
      const data = await res.json();

      setNombre(data.nombre);
      setPrecio(data.precio);
      setStock(data.stock);
      setTieneStock(data.tiene_stock === 1);
    };

    cargarProducto();
  }, [id]);

  const actualizarProducto = async () => {
    try {
      const res = await fetch(`http://localhost:${PORT}/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, precio, stock, tiene_stock: tieneStock }),
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
      <h2 className="d-flex align-items-center gap-2 mb-4">
        <Package />
        Editar producto
      </h2>

      <div className="card p-4">
        <div className="mb-3">
          <label className="form-label">Nombre</label>
          <input
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
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

        <div className="d-flex gap-3">
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/productos")}
          >
            <ArrowLeft size={18} /> Volver
          </button>

          <button className="btn btn-success" onClick={actualizarProducto}>
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditarProducto;
