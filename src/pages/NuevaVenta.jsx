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
      if (buscadorRef.current && !buscadorRef.current.contains(event.target))
        setMostrarLista(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const agregarProducto = () => {
    if (!productoSeleccionado) return toast.warning("Seleccioná un producto");

    // Solo validar stock si el producto lo maneja
    if (productoSeleccionado.tiene_stock !== 0) {
      if (productoSeleccionado.stock === 0)
        return toast.error("Este producto no tiene stock");
      if (cantidad > productoSeleccionado.stock)
        return toast.warning(
          `Solo hay ${productoSeleccionado.stock} unidades disponibles`,
        );
    }

    setCarrito([
      ...carrito,
      {
        id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        precio: productoSeleccionado.precio,
        cantidad,
      },
    ]);
    setBusqueda("");
    setProductoSeleccionado(null);
    setCantidad(1);
  };

  useEffect(() => {
    setTotal(carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0));
  }, [carrito]);

  const finalizarVenta = async () => {
    if (carrito.length === 0) return toast.warn("No hay productos en la venta");
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
      { autoClose: false, closeOnClick: false, draggable: false },
    );
  };

  const removerProducto = (index, name) => {
    setCarrito(carrito.filter((_, i) => i !== index));
    toast.success(`Producto eliminado del carrito: ${name}`);
  };

  const totalUnidades = carrito.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3 bg-success bg-opacity-10"
          style={{ width: 42, height: 42, flexShrink: 0 }}
        >
          <ShoppingCart size={20} className="text-success" />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
            Nueva Venta
          </h2>
          <small className="text-muted">
            Registrá los productos de la venta
          </small>
        </div>
      </div>

      <div className="row g-4">
        {/* Columna izquierda — buscador */}
        <div className="col-md-5">
          <div className="card p-4" style={{ borderRadius: 12 }}>
            <p
              className="text-muted mb-3"
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Agregar producto
            </p>

            <div className="mb-3 position-relative" ref={buscadorRef}>
              <label className="form-label" style={{ fontSize: 13 }}>
                Buscar producto
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Escribí para buscar..."
                value={busqueda}
                onFocus={() => setMostrarLista(true)}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              {mostrarLista && productosFiltrados.length > 0 && (
                <div
                  className="card position-absolute w-100 shadow"
                  style={{
                    zIndex: 100,
                    borderRadius: 10,
                    overflow: "hidden",
                    top: "100%",
                    marginTop: 4,
                  }}
                >
                  {productosFiltrados.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      style={{
                        fontSize: 13,
                        padding: "9px 14px",
                        border: "none",
                      }}
                      onClick={() => {
                        setProductoSeleccionado(p);
                        setBusqueda(p.nombre);
                        setMostrarLista(false);
                      }}
                    >
                      <span className="fw-semibold">{p.nombre}</span>
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        ${p.precio.toLocaleString("es-AR")} ·{" "}
                        {p.tiene_stock === 0 ? (
                          <span className="text-muted fw-semibold">
                            Sin manejo de stock
                          </span>
                        ) : (
                          <span
                            className={
                              p.stock === 0
                                ? "text-danger fw-semibold"
                                : "text-success fw-semibold"
                            }
                          >
                            Stock {p.stock}
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label" style={{ fontSize: 13 }}>
                Cantidad
              </label>
              <input
                type="number"
                className="form-control"
                value={cantidad}
                min={1}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </div>

            <button
              className="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2"
              onClick={agregarProducto}
            >
              <Plus size={16} /> Agregar al carrito
            </button>
          </div>
        </div>

        {/* Columna derecha — carrito */}
        <div className="col-md-7">
          <div className="card" style={{ borderRadius: 12 }}>
            <div
              className="card-body d-flex flex-column"
              style={{ minHeight: 320 }}
            >
              <p
                className="text-muted mb-3"
                style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Carrito
              </p>

              {carrito.length === 0 ? (
                <div
                  className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-muted"
                  style={{ gap: 8, padding: "2rem 0" }}
                >
                  <ShoppingCart size={32} strokeWidth={1.2} />
                  <span style={{ fontSize: 14 }}>El carrito está vacío</span>
                </div>
              ) : (
                <>
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="text-center">Cant.</th>
                          <th className="text-end">Precio</th>
                          <th className="text-end">Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {carrito.map((p, i) => (
                          <tr key={i}>
                            <td className="fw-semibold">{p.nombre}</td>
                            <td className="text-center">
                              <span className="badge bg-secondary">
                                {p.cantidad}
                              </span>
                            </td>
                            <td
                              className="text-end text-muted"
                              style={{ fontSize: 13 }}
                            >
                              ${p.precio.toLocaleString("es-AR")}
                            </td>
                            <td className="text-end fw-semibold">
                              ${(p.precio * p.cantidad).toLocaleString("es-AR")}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-danger d-flex align-items-center"
                                style={{ padding: "3px 7px" }}
                                onClick={() => removerProducto(i, p.nombre)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total y botones */}
                  <div className="border-top pt-3 mt-3">
                    <div className="d-flex justify-content-between align-items-end mb-3">
                      <small className="text-muted">
                        {carrito.length} producto
                        {carrito.length !== 1 ? "s" : ""} · {totalUnidades}{" "}
                        unidad{totalUnidades !== 1 ? "es" : ""}
                      </small>
                      <div className="text-end">
                        <div
                          className="text-muted"
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Total
                        </div>
                        <div
                          className="text-success fw-bold"
                          style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
                        >
                          ${total.toLocaleString("es-AR")}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger flex-fill"
                        onClick={reiniciarVenta}
                      >
                        Reiniciar
                      </button>
                      <button
                        className="btn btn-primary flex-fill btn-lg"
                        onClick={finalizarVenta}
                      >
                        Finalizar venta →
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
