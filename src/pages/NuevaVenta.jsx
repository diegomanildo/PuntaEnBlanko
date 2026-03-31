/* eslint-disable react-hooks/set-state-in-effect */
import {
  ShoppingCart,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  User,
  UserPlus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { PORT } from "../../backend/config";
import { toast } from "react-toastify";
import BackButton from "../components/UI/BackButton";
import TicketModal from "../components/modals/TicketModal";
import { useNavigate } from "react-router-dom";
import { rowStyle } from "../utils/colorUtils";

// ── Componente principal ──────────────────────────────────────────────────────
function NuevaVenta() {
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
  const barcodeBufferRef = useRef("");
  const barcodeTimerRef = useRef(null);

  // ── Estados para edición de precios ──────────────────────────────────────
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [editandoTotal, setEditandoTotal] = useState(false);
  const inputPrecioRef = useRef(null);
  const inputTotalRef = useRef(null);

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

  // Focus automático al abrir edición
  useEffect(() => {
    if (editandoPrecio !== null && inputPrecioRef.current) {
      inputPrecioRef.current.focus();
      inputPrecioRef.current.select();
    }
  }, [editandoPrecio]);

  useEffect(() => {
    if (editandoTotal && inputTotalRef.current) {
      inputTotalRef.current.focus();
      inputTotalRef.current.select();
    }
  }, [editandoTotal]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

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
              precioOriginal: producto.precio,
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

  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:${PORT}/productos`)
      .then((res) => res.json())
      .then((data) => setProductos(data));
  }, []);

  // ── Click outside — cierra AMBAS listas ──────────────────────────────────
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

    if (productoSeleccionado.tiene_stock !== 0) {
      if (productoSeleccionado.stock === 0)
        return toast.error("Este producto no tiene stock");
      if (cantidad > productoSeleccionado.stock)
        return toast.warning(
          `Solo hay ${productoSeleccionado.stock} unidades disponibles`,
        );
    }

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
          precioOriginal: productoSeleccionado.precio,
          cantidad: Number(cantidad),
        },
      ]);
    }

    setBusqueda("");
    setProductoSeleccionado(null);
    setCantidad(1);
  };

  const totalManualRef = useRef(false);

  useEffect(() => {
    if (totalManualRef.current) return;
    setTotal(carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0));
  }, [carrito]);

  // ── Edición de precio por producto ────────────────────────────────────────

  const iniciarEditPrecio = (index, campo) =>
    setEditandoPrecio({ index, campo });

  const confirmarEditPrecio = () => {
    if (!editandoPrecio || !inputPrecioRef.current) return;
    const { index, campo } = editandoPrecio;
    const num = parseFloat(inputPrecioRef.current.value);

    if (isNaN(num) || num < 0) {
      toast.error("Ingresá un precio válido");
      setEditandoPrecio(null);
      return;
    }

    const nuevoCarrito = carrito.map((p, i) => {
      if (i !== index) return p;
      if (campo === "precio") return { ...p, precio: num };
      return { ...p, precio: Math.round((num / p.cantidad) * 100) / 100 };
    });
    setCarrito(nuevoCarrito);
    setEditandoPrecio(null);
    toast.success("Precio actualizado");
  };

  const cancelarEditPrecio = () => setEditandoPrecio(null);

  const handleKeyEditPrecio = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmarEditPrecio();
    }
    if (e.key === "Escape") cancelarEditPrecio();
  };

  // ── Edición de total ──────────────────────────────────────────────────────

  const iniciarEditTotal = () => {
    if (carrito.length === 0) return;
    setEditandoTotal(true);
  };

  const confirmarEditTotal = () => {
    if (!inputTotalRef.current) return;
    const num = parseFloat(inputTotalRef.current.value);

    if (isNaN(num) || num < 0) {
      toast.error("Ingresá un total válido");
      setEditandoTotal(false);
      return;
    }

    setTotal(num);
    totalManualRef.current = true;
    setEditandoTotal(false);
    toast.success("Total actualizado");
  };

  const cancelarEditTotal = () => setEditandoTotal(false);

  const handleKeyEditTotal = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmarEditTotal();
    }
    if (e.key === "Escape") cancelarEditTotal();
  };

  // ── Venta ─────────────────────────────────────────────────────────────────

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
          cliente_id: clienteId ?? null,
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
                totalManualRef.current = false;
                setBusqueda("");
                setProductoSeleccionado(null);
                setCantidad(1);
                setEditandoPrecio(null);
                setEditandoTotal(false);
                setClienteId(null);
                setBusquedaCliente("");
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
    if (editandoPrecio?.index === index) setEditandoPrecio(null);
    setCarrito(carrito.filter((_, i) => i !== index));
    toast.success(`Producto eliminado del carrito: ${name}`);
  };

  const totalUnidades = carrito.reduce((acc, p) => acc + p.cantidad, 0);

  const precioModificado = (item) =>
    item.precioOriginal !== undefined && item.precio !== item.precioOriginal;

  return (
    <div>
      {ticketData && (
        <TicketModal
          ticket={ticketData}
          onClose={() => {
            setTicketData(null);
            setCarrito([]);
            setTotal(0);
            totalManualRef.current = false;
            setMedioPago("efectivo");
            setMontoEfectivo("");
            setMontoTransferencia("");
            setClienteId(null);
            setBusquedaCliente("");
          }}
        />
      )}

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
        {/* Columna izquierda */}
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
                Cliente{" "}
                <span className="text-muted" style={{ fontSize: 11 }}>
                  (opcional)
                </span>
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
                  className="btn btn-success d-flex align-items-center justify-content-center"
                  onClick={() =>
                    navigate("/clientes/nuevo", {
                      state: { backDir: "/ventas/nueva" },
                    })
                  }
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

            {/* ── Buscador de producto ── */}
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
                          <th className="text-end">
                            Precio{" "}
                            <span
                              className="text-muted"
                              style={{ fontSize: 10, fontWeight: 400 }}
                            >
                              (u.)
                            </span>
                          </th>
                          <th className="text-end">Subtotal</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {carrito.map((p, i) => {
                          const editandoEsteItemPrecio =
                            editandoPrecio?.index === i &&
                            editandoPrecio?.campo === "precio";
                          const editandoEsteItemSubtotal =
                            editandoPrecio?.index === i &&
                            editandoPrecio?.campo === "subtotal";

                          return (
                            <tr key={i}>
                              <td
                                className="fw-semibold"
                                style={{ verticalAlign: "middle" }}
                              >
                                {p.nombre}
                                {precioModificado(p) && (
                                  <span
                                    className="badge bg-warning text-dark ms-1"
                                    style={{
                                      fontSize: 9,
                                      verticalAlign: "middle",
                                    }}
                                    title={`Precio original: $${p.precioOriginal?.toLocaleString("es-AR")}`}
                                  >
                                    modificado
                                  </span>
                                )}
                              </td>
                              <td
                                className="text-center"
                                style={{ verticalAlign: "middle" }}
                              >
                                <span className="badge bg-secondary">
                                  {p.cantidad}
                                </span>
                              </td>

                              {/* Precio unitario editable */}
                              <td
                                className="text-end"
                                style={{
                                  verticalAlign: "middle",
                                  minWidth: 110,
                                }}
                              >
                                {editandoEsteItemPrecio ? (
                                  <div className="d-flex align-items-center justify-content-end gap-1">
                                    <span
                                      className="text-muted"
                                      style={{ fontSize: 12 }}
                                    >
                                      $
                                    </span>
                                    <input
                                      ref={inputPrecioRef}
                                      type="number"
                                      className="form-control form-control-sm text-end"
                                      style={{ width: 80, fontSize: 13 }}
                                      defaultValue={p.precio}
                                      min={0}
                                      onKeyDown={handleKeyEditPrecio}
                                    />
                                    <button
                                      className="btn btn-sm btn-success p-1"
                                      style={{ lineHeight: 1 }}
                                      onClick={confirmarEditPrecio}
                                      title="Confirmar"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-secondary p-1"
                                      style={{ lineHeight: 1 }}
                                      onClick={cancelarEditPrecio}
                                      title="Cancelar"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn btn-link btn-sm p-0 text-muted d-inline-flex align-items-center gap-1"
                                    style={{
                                      fontSize: 13,
                                      textDecoration: "none",
                                    }}
                                    onClick={() =>
                                      iniciarEditPrecio(i, "precio")
                                    }
                                    title="Editar precio unitario"
                                  >
                                    ${p.precio.toLocaleString("es-AR")}
                                    <Pencil size={11} className="opacity-50" />
                                  </button>
                                )}
                              </td>

                              {/* Subtotal editable */}
                              <td
                                className="text-end fw-semibold"
                                style={{
                                  verticalAlign: "middle",
                                  minWidth: 110,
                                }}
                              >
                                {editandoEsteItemSubtotal ? (
                                  <div className="d-flex align-items-center justify-content-end gap-1">
                                    <span
                                      className="text-muted"
                                      style={{ fontSize: 12 }}
                                    >
                                      $
                                    </span>
                                    <input
                                      ref={inputPrecioRef}
                                      type="number"
                                      className="form-control form-control-sm text-end"
                                      style={{ width: 80, fontSize: 13 }}
                                      defaultValue={p.precio * p.cantidad}
                                      min={0}
                                      onKeyDown={handleKeyEditPrecio}
                                    />
                                    <button
                                      className="btn btn-sm btn-success p-1"
                                      style={{ lineHeight: 1 }}
                                      onClick={confirmarEditPrecio}
                                      title="Confirmar"
                                    >
                                      <Check size={12} />
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-secondary p-1"
                                      style={{ lineHeight: 1 }}
                                      onClick={cancelarEditPrecio}
                                      title="Cancelar"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1"
                                    style={{
                                      fontSize: 13,
                                      textDecoration: "none",
                                      color: "inherit",
                                    }}
                                    onClick={() =>
                                      iniciarEditPrecio(i, "subtotal")
                                    }
                                    title="Editar subtotal"
                                  >
                                    $
                                    {(p.precio * p.cantidad).toLocaleString(
                                      "es-AR",
                                    )}
                                    <Pencil size={11} className="opacity-50" />
                                  </button>
                                )}
                              </td>

                              <td
                                className="text-center"
                                style={{ verticalAlign: "middle" }}
                              >
                                <button
                                  className="btn btn-sm btn-danger d-flex align-items-center"
                                  style={{ padding: "3px 7px" }}
                                  onClick={() => removerProducto(i, p.nombre)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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

                    {/* Total editable */}
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

                        {editandoTotal ? (
                          <div className="d-flex align-items-center gap-1 justify-content-end">
                            <span
                              className="fw-bold text-success"
                              style={{ fontSize: "1.3rem" }}
                            >
                              $
                            </span>
                            <input
                              ref={inputTotalRef}
                              type="number"
                              className="form-control form-control-sm text-end fw-bold"
                              style={{
                                width: 110,
                                fontSize: "1.2rem",
                                color: "var(--bs-success)",
                                borderColor: "var(--bs-success)",
                              }}
                              defaultValue={total}
                              min={0}
                              onKeyDown={handleKeyEditTotal}
                            />
                            <div className="d-flex flex-column gap-1">
                              <button
                                className="btn btn-sm btn-success p-1"
                                style={{ lineHeight: 1 }}
                                onClick={confirmarEditTotal}
                                title="Confirmar total"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary p-1"
                                style={{ lineHeight: 1 }}
                                onClick={cancelarEditTotal}
                                title="Cancelar"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn btn-link p-0 d-inline-flex align-items-center gap-2"
                            style={{ textDecoration: "none" }}
                            onClick={iniciarEditTotal}
                            title="Editar total"
                          >
                            <span
                              className="text-success fw-bold"
                              style={{ fontSize: "1.6rem", lineHeight: 1.1 }}
                            >
                              ${total.toLocaleString("es-AR")}
                            </span>
                            <Pencil
                              size={14}
                              className="text-muted opacity-75"
                            />
                          </button>
                        )}

                        {carrito.some(precioModificado) && (
                          <div
                            style={{ fontSize: 10 }}
                            className="text-warning mt-1"
                          >
                            ⚠ Precios personalizados activos
                          </div>
                        )}
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
