/* eslint-disable react-hooks/set-state-in-effect */
import { FileText, Plus, Save, Trash2, UserPlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { PORT } from "../../../backend/config";
import { toast } from "react-toastify";
import TicketModal from "../../components/modals/TicketModal";
import BackButton from "../../components/UI/BackButton";
import { useNavigate } from "react-router-dom";

function NuevoPresupuesto() {
  const navigate = useNavigate();

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
  const [ticketData, setTicketData] = useState(null);
  const barcodeBufferRef = useRef("");
  const barcodeTimerRef = useRef(null);

  // ── Cliente ───────────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false);
  const clienteBuscadorRef = useRef(null);

  useEffect(() => {
    fetch(`http://localhost:${PORT}/clientes`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setClientes(data));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        const codigo = barcodeBufferRef.current.trim();
        barcodeBufferRef.current = "";
        clearTimeout(barcodeTimerRef.current);

        if (codigo.length < 3) return;
        e.preventDefault();

        const producto = productos.find((p) => p.codigo_barras === codigo);
        if (!producto) {
          toast.error(`Producto con código "${codigo}" no encontrado`);
          return;
        }

        const yaEnCarrito = carrito.findIndex((p) => p.id === producto.id);
        if (yaEnCarrito !== -1) {
          const nuevoCarrito = [...carrito];
          nuevoCarrito[yaEnCarrito].cantidad += 1;
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

  useEffect(() => {
    fetch(`http://localhost:${PORT}/productos`)
      .then((res) => res.json())
      .then((data) => setProductos(data));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target))
        setMostrarLista(false);
      if (
        clienteBuscadorRef.current &&
        !clienteBuscadorRef.current.contains(event.target)
      )
        setMostrarListaClientes(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const clientesFiltrados = clientes.filter((c) =>
    c.razon_social.toLowerCase().includes(busquedaCliente.toLowerCase()),
  );

  const agregarProducto = () => {
    if (!productoSeleccionado) return toast.warning("Seleccioná un producto");

    const yaEnCarrito = carrito.findIndex(
      (p) => p.id === productoSeleccionado.id,
    );

    if (yaEnCarrito !== -1) {
      const nuevoCarrito = [...carrito];
      nuevoCarrito[yaEnCarrito].cantidad += Number(cantidad);
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

  const resetForm = () => {
    setCarrito([]);
    setTotal(0);
    setClienteId(null);
    setBusquedaCliente("");
    setBusqueda("");
    setProductoSeleccionado(null);
    setCantidad(1);
    setMedioPago("efectivo");
    setMontoEfectivo("");
    setMontoTransferencia("");
  };

  const guardarPresupuesto = async () => {
    if (carrito.length === 0)
      return toast.warn("No hay productos en el presupuesto");

    if (medioPago === "mix") {
      const suma = Number(montoEfectivo) + Number(montoTransferencia);
      if (Math.abs(suma - total) >= 1)
        return toast.error("Los montos del mix no coinciden con el total");
    }

    try {
      const res = await fetch(`http://localhost:${PORT}/presupuestos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productos: carrito,
          total,
          cliente_id: clienteId ?? null,
          cliente_nombre: busquedaCliente.trim() || null,
          medio_pago: medioPago,
          monto_efectivo: medioPago === "mix" ? Number(montoEfectivo) : null,
          monto_transferencia:
            medioPago === "mix" ? Number(montoTransferencia) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const nombreCliente = clienteId
          ? clientes.find((c) => c.id === clienteId)?.razon_social
          : busquedaCliente.trim();

        // Si no puso nada, bloquear
        if (!nombreCliente || nombreCliente.trim() === "") {
          return toast.error(
            "Ingresá un nombre de cliente o seleccioná uno de la lista",
          );
        }

        toast.success(`Presupuesto de "${nombreCliente}" guardado`);

        setTicketData({
          id: data.id,
          fecha: new Date().toISOString(),
          cliente_nombre: nombreCliente,
          productos: carrito,
          total,
          medio_pago: medioPago,
          monto_efectivo: medioPago === "mix" ? Number(montoEfectivo) : null,
          monto_transferencia:
            medioPago === "mix" ? Number(montoTransferencia) : null,
        });
      } else {
        toast.error(data.message || "Error al guardar el presupuesto");
      }
    } catch (error) {
      toast.error("Error al guardar el presupuesto: " + error.message);
    }
  };

  const reiniciarPresupuesto = () => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">¿Reiniciar el presupuesto actual?</p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                resetForm();
                toast.success("Presupuesto reiniciado");
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
    toast.success(`Producto eliminado: ${name}`);
  };

  const totalUnidades = carrito.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <div>
      {ticketData && (
        <TicketModal
          ticket={ticketData}
          tipo="presupuesto"
          onClose={() => {
            setTicketData(null);
            resetForm();
          }}
        />
      )}

      <BackButton dir="/presupuestos" />
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
            background: "rgba(99, 102, 241, 0.12)",
          }}
        >
          <FileText size={20} style={{ color: "#6366f1" }} />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
            Nuevo Presupuesto
          </h2>
          <small className="text-muted">
            Armá un presupuesto sin generar una venta
          </small>
        </div>
      </div>

      <div className="row g-4">
        {/* Columna izquierda — buscador + cliente */}
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

            {/* ── Buscador de cliente ── */}
            <div className="mb-3 position-relative" ref={clienteBuscadorRef}>
              <label className="form-label" style={{ fontSize: 13 }}>
                Cliente
              </label>

              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar cliente..."
                  value={busquedaCliente}
                  onFocus={() => setMostrarListaClientes(true)}
                  onChange={(e) => {
                    setBusquedaCliente(e.target.value);
                    setClienteId(null);
                    setMostrarListaClientes(true);
                  }}
                />
                <button
                  className="btn d-flex align-items-center justify-content-center"
                  style={{
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                  }}
                  onClick={() =>
                    navigate("/clientes/nuevo", {
                      state: { backDir: "/presupuestos/nuevo" },
                    })
                  }
                  title="Nuevo cliente"
                >
                  <UserPlus size={16} />
                </button>
              </div>

              {clienteId && (
                <small
                  className="text-success d-block mt-1"
                  style={{ fontSize: 11 }}
                >
                  ✓ Cliente seleccionado
                </small>
              )}

              {mostrarListaClientes && (
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
                  {clientesFiltrados.length === 0 ? (
                    <div className="p-3 text-muted" style={{ fontSize: 13 }}>
                      No se encontraron clientes
                    </div>
                  ) : (
                    clientesFiltrados.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        style={{
                          fontSize: 13,
                          padding: "9px 14px",
                          border: "none",
                        }}
                        onClick={() => {
                          setClienteId(c.id);
                          setBusquedaCliente(c.razon_social);
                          setMostrarListaClientes(false);
                        }}
                      >
                        <span className="fw-semibold">{c.razon_social}</span>
                        <code style={{ fontSize: 10 }}>{c.cuit}</code>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Buscador de productos */}
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
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center${p.color ? ` dropdown-prod-${p.color}` : ""}`}
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
                        ${p.precio.toLocaleString("es-AR")}
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
              className="btn w-100 d-flex align-items-center justify-content-center gap-2"
              style={{
                background: "#6366f1",
                color: "#fff",
                border: "none",
              }}
              onClick={agregarProducto}
            >
              <Plus size={16} /> Agregar al presupuesto
            </button>
          </div>
        </div>

        {/* Columna derecha — lista de productos */}
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
                Detalle del presupuesto
              </p>

              {carrito.length === 0 ? (
                <div
                  className="d-flex flex-column align-items-center justify-content-center flex-grow-1 text-muted"
                  style={{ gap: 8, padding: "2rem 0" }}
                >
                  <FileText size={32} strokeWidth={1.2} />
                  <span style={{ fontSize: 14 }}>
                    El presupuesto está vacío
                  </span>
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

                  {/* Medio de pago + Total + acciones */}
                  <div className="border-top pt-3 mt-3">
                    {/* Medio de pago */}
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

                    {/* Campos mix */}
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
                          Total estimado
                        </div>
                        <div
                          className="fw-bold"
                          style={{
                            fontSize: "1.6rem",
                            lineHeight: 1.1,
                            color: "#6366f1",
                          }}
                        >
                          ${total.toLocaleString("es-AR")}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-danger flex-fill"
                        onClick={reiniciarPresupuesto}
                      >
                        Reiniciar
                      </button>
                      <button
                        className="btn btn-lg flex-fill"
                        style={{
                          background: "#6366f1",
                          color: "#fff",
                          border: "none",
                        }}
                        onClick={guardarPresupuesto}
                      >
                        <Save size={18} /> Guardar presupuesto →
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

export default NuevoPresupuesto;
