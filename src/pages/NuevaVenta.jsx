/* eslint-disable react-hooks/set-state-in-effect */
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { PORT } from "../../backend/config";
import { toast } from "react-toastify";
import BackButton from "../components/UI/BackButton";
import TicketModal from "../components/modals/TicketModal";

// ── Componente principal ──────────────────────────────────────────────────────
function NuevaVenta() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarLista, setMostrarLista] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const buscadorRef = useRef(null);
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [medioPago, setMedioPago] = useState("efectivo");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const barcodeBufferRef = useRef("");
  const barcodeTimerRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        const codigo = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = "";
        clearTimeout(barcodeTimerRef.current);

        // Si el buffer tiene menos de 3 chars, probablemente no es un escáner
        if (codigo.length < 3) return;

        // ✅ Evitar que el Enter llegue al input
        e.preventDefault();

        const producto = productos.find((p) => p.codigo_barras === codigo);

        if (!producto) {
          toast.error(`Producto con código "${codigo}" no encontrado`);
          return;
        }

        if (producto.tiene_stock !== 0 && producto.stock === 0) {
          toast.error(`"${producto.nombre}" no tiene stock`);
          return;
        }

        const yaEnCarrito = carrito.findIndex((p) => p.id === producto.id);
        if (yaEnCarrito !== -1) {
          const nuevaCantidad = carrito[yaEnCarrito].cantidad + 1;
          if (producto.tiene_stock !== 0 && nuevaCantidad > producto.stock) {
            toast.warning(`Solo hay ${producto.stock} unidades disponibles`);
            return;
          }
          const nuevoCarrito = [...carrito];
          nuevoCarrito[yaEnCarrito].cantidad = nuevaCantidad;
          setCarrito(nuevoCarrito);
        } else {
          setCarrito((prev) => [
            ...prev,
            {
              id: producto.id,
              nombre: producto.nombre,
              precio: producto.precio,
              cantidad: 1,
            },
          ]);
        }

        toast.success(`"${producto.nombre}" agregado`);

        // ✅ Limpiar el input de búsqueda por si el escáner escribió ahí
        setBusqueda("");
        setMostrarLista(false);
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
        clearTimeout(barcodeTimerRef.current);
        barcodeTimerRef.current = setTimeout(() => {
          barcodeBufferRef.current = "";
        }, 100);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [productos, carrito]);

  // Estado del ticket para el modal
  const [ticketData, setTicketData] = useState(null);

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

    if (productoSeleccionado.tiene_stock !== 0) {
      if (productoSeleccionado.stock === 0)
        return toast.error("Este producto no tiene stock");
      if (cantidad > productoSeleccionado.stock)
        return toast.warning(
          `Solo hay ${productoSeleccionado.stock} unidades disponibles`,
        );
    }

    // ✅ Verificar si ya está en el carrito
    const yaEnCarrito = carrito.findIndex(
      (p) => p.id === productoSeleccionado.id,
    );

    if (yaEnCarrito !== -1) {
      const nuevaCantidad = carrito[yaEnCarrito].cantidad + Number(cantidad);
      if (
        productoSeleccionado.tiene_stock !== 0 &&
        nuevaCantidad > productoSeleccionado.stock
      ) {
        return toast.warning(
          `Solo hay ${productoSeleccionado.stock} unidades disponibles (ya tenés ${carrito[yaEnCarrito].cantidad} en el carrito)`,
        );
      }
      const nuevoCarrito = [...carrito];
      nuevoCarrito[yaEnCarrito].cantidad = nuevaCantidad;
      setCarrito(nuevoCarrito);
    } else {
      setCarrito([
        ...carrito,
        {
          id: productoSeleccionado.id,
          nombre: productoSeleccionado.nombre,
          precio: productoSeleccionado.precio,
          cantidad: Number(cantidad),
        },
      ]);
    }

    setBusqueda("");
    setProductoSeleccionado(null);
    setCantidad(1);
  };

  useEffect(() => {
    setTotal(carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0));
  }, [carrito]);

  const finalizarVenta = async () => {
    if (carrito.length === 0) return toast.warn("No hay productos en la venta");

    if (medioPago === "mix") {
      const suma = Number(montoEfectivo) + Number(montoTransferencia);
      if (Math.abs(suma - total) >= 1)
        return toast.error("Los montos del mix no coinciden con el total");
    }

    try {
      const res = await fetch(`http://localhost:${PORT}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productos: carrito,
          total,
          medio_pago: medioPago,
          monto_efectivo: medioPago === "mix" ? Number(montoEfectivo) : null,
          monto_transferencia:
            medioPago === "mix" ? Number(montoTransferencia) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Venta realizada");

        setTicketData({
          id: data.id ?? Date.now(),
          fecha: new Date().toISOString(),
          productos: carrito,
          total,
          medio_pago: medioPago,
          monto_efectivo: medioPago === "mix" ? Number(montoEfectivo) : null,
          monto_transferencia:
            medioPago === "mix" ? Number(montoTransferencia) : null,
        });
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
      {/* Modal de ticket — se muestra tras venta exitosa */}
      {ticketData && (
        <TicketModal
          ticket={ticketData}
          onClose={() => {
            setTicketData(null);
            setCarrito([]);
            setTotal(0);
            setMedioPago("efectivo");
            setMontoEfectivo("");
            setMontoTransferencia("");
          }}
        />
      )}

      {/* Header */}
      <BackButton dir="/" />
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
                onChange={(e) => setCantidad(e.target.value)}
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

                  {/* Total y medio de pago */}
                  <div className="border-top pt-3 mt-3">
                    <div className="mb-3">
                      <label className="form-label" style={{ fontSize: 13 }}>
                        Medio de pago
                      </label>
                      <div className="d-flex gap-2">
                        {["efectivo", "transferencia", "mix"].map((m) => (
                          <button
                            key={m}
                            className={`btn btn-sm flex-fill ${medioPago === m ? "btn-dark" : "btn-outline-secondary"}`}
                            style={{
                              textTransform: "capitalize",
                              fontSize: 13,
                            }}
                            onClick={() => {
                              setMedioPago(m);
                              setMontoEfectivo("");
                              setMontoTransferencia("");
                            }}
                          >
                            {m === "efectivo"
                              ? "💵 Efectivo"
                              : m === "transferencia"
                                ? "📲 Transferencia"
                                : "🔀 Mix"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {medioPago === "mix" && (
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label
                            className="form-label"
                            style={{ fontSize: 12 }}
                          >
                            Efectivo
                          </label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="$0"
                            value={montoEfectivo}
                            min={0}
                            onChange={(e) => {
                              const valor = e.target.value;
                              setMontoEfectivo(valor);
                              setMontoTransferencia(
                                valor === ""
                                  ? ""
                                  : String(Math.max(0, total - Number(valor))),
                              );
                            }}
                          />
                        </div>
                        <div className="col-6">
                          <label
                            className="form-label"
                            style={{ fontSize: 12 }}
                          >
                            Transferencia
                          </label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="$0"
                            value={montoTransferencia}
                            min={0}
                            onChange={(e) => {
                              const valor = e.target.value;
                              setMontoTransferencia(valor);
                              setMontoEfectivo(
                                valor === ""
                                  ? ""
                                  : String(Math.max(0, total - Number(valor))),
                              );
                            }}
                          />
                        </div>
                        {montoEfectivo !== "" &&
                          montoTransferencia !== "" &&
                          (() => {
                            const suma =
                              Number(montoEfectivo) +
                              Number(montoTransferencia);
                            const ok = Math.abs(suma - total) < 1;
                            return (
                              <div className="col-12">
                                <small
                                  className={
                                    ok ? "text-success" : "text-danger"
                                  }
                                >
                                  {ok
                                    ? "✓ Los montos coinciden con el total"
                                    : `⚠ Suma $${suma.toLocaleString("es-AR")} — falta $${(total - suma).toLocaleString("es-AR")}`}
                                </small>
                              </div>
                            );
                          })()}
                      </div>
                    )}

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
