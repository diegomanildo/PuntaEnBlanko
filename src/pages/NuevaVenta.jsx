import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { PORT } from "../../backend/config";
import { toast } from "react-toastify";

function NuevaVenta() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const buscadorRef = useRef(null);

  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`http://localhost:${PORT}/productos`)
      .then((res) => res.json())
      .then((data) => setProductos(data));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setMostrarLista(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      toast.warning("Selecciona un producto");
      return;
    }

    if (productoSeleccionado.stock === 0) {
      toast.error("Este producto no tiene stock disponible");
      return;
    }

    if (cantidad > productoSeleccionado.stock) {
      toast.warning(
        `Solo hay ${productoSeleccionado.stock} unidades disponibles`,
      );
      return;
    }

    const nuevo = {
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      precio: productoSeleccionado.precio,
      cantidad,
    };

    setCarrito([...carrito, nuevo]);

    setBusqueda("");
    setProductoSeleccionado(null);
    setCantidad(1);
  };

  useEffect(() => {
    const nuevoTotal = carrito.reduce(
      (acc, p) => acc + p.precio * p.cantidad,
      0,
    );

    setTotal(nuevoTotal);
  }, [carrito]);

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      return toast.warn("No hay productos en la venta");
    }

    try {
      const res = await fetch(`http://localhost:${PORT}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: carrito, total }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "Venta realizada");
        setCarrito([]);
        setTotal(0);
      } else {
        toast.error(data.message || "Error en la venta");
      }
    } catch (error) {
      toast.error("Error al finalizar la venta: " + error.message);
    }
  };

  const reiniciarVenta = () => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">¿Reiniciar la venta actual?</p>

          <div className="d-flex gap-2">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                setCarrito([]);
                setTotal(0);
                setBusqueda("");
                setProductoSeleccionado(null);
                setCantidad(1);
                toast.success("Venta reiniciada");
                closeToast();
              }}
            >
              Reiniciar
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

  const removerProducto = (index) => {
    const nuevoCarrito = carrito.filter((_, i) => i !== index);
    setCarrito(nuevoCarrito);
    toast.success("Producto eliminado del carrito");
  };

  return (
    <div className="container">
      <h2 className="mb-4 d-flex align-items-center gap-2">
        <ShoppingCart />
        Nueva Venta
      </h2>

      <div className="row g-4">
        {/* columna izquierda */}

        <div className="col-md-5">
          <div className="card p-4">
            <h5 className="mb-3">Agregar producto</h5>

            <div className="mb-3 position-relative" ref={buscadorRef}>
              <label>Buscar producto</label>

              <input
                type="text"
                className="form-control"
                value={busqueda}
                onFocus={() => setMostrarLista(true)}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              {mostrarLista && (
                <div className="list-group position-absolute w-100 shadow">
                  {productosFiltrados.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between `}
                      onClick={() => {
                        setProductoSeleccionado(p);
                        setBusqueda(p.nombre);
                        setMostrarLista(false);
                      }}
                    >
                      <span>{p.nombre}</span>

                      <small className="text-muted">
                        ${p.precio} | <span className={`fw-semibold ${p.stock === 0 ? "text-danger" : ""}`}>Stock {p.stock}</span>
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label>Cantidad</label>

              <input
                type="number"
                className="form-control"
                value={cantidad}
                min={1}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>

            <button
              className="btn btn-success d-flex align-items-center gap-2"
              onClick={agregarProducto}
            >
              <Plus size={18} />
              Agregar al carrito
            </button>
          </div>
        </div>

        {/* columna derecha */}
        <div className="col-md-7">
          <div className="card">
            <div className="card-body">
              <h5 className="mb-3">Carrito</h5>

              {carrito.length === 0 && (
                <p className="text-muted">No hay productos agregados</p>
              )}

              {carrito.length > 0 && (
                <>
                  {/* contenedor con scroll */}
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                          <th>Accion</th>
                        </tr>
                      </thead>

                      <tbody>
                        {carrito.map((p, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">{p.nombre}</td>

                            <td>
                              <span className="badge bg-secondary">
                                {p.cantidad}
                              </span>
                            </td>

                            <td>${p.precio}</td>

                            <td className="fw-semibold">
                              ${p.precio * p.cantidad}
                            </td>

                            <td>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => removerProducto(i)}
                              >
                                <Trash2 size={16} /> Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total y finalizar */}
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <h3 className="text-success mb-0">Total: ${total}</h3>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger"
                        onClick={reiniciarVenta}
                      >
                        Reiniciar
                      </button>

                      <button
                        className="btn btn-primary btn-lg"
                        onClick={finalizarVenta}
                      >
                        Finalizar venta
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NuevaVenta;
