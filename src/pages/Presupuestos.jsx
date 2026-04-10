/* eslint-disable react-hooks/set-state-in-effect */
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Pencil,
  CheckCircle,
  Clock,
  ClipboardList,
  Printer,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import TicketModal from "../components/modals/TicketModal";
import BackButton from "../components/BackButton";
import SearchBar from "../components/SearchBar";
import API_URL from "../config";

function Presupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [orden, setOrden] = useState({
    columna: "cliente_nombre",
    direccion: "asc",
  });
  const [ticketData, setTicketData] = useState(null);
  const [busquedaFiltro, setBusquedaFiltro] = useState("");

  const cargarPresupuestos = async () => {
    const res = await fetch(`${API_URL}/presupuestos`);
    const data = await res.json();
    setPresupuestos(
      data.sort((a, b) =>
        (a.cliente_nombre ?? "").localeCompare(b.cliente_nombre ?? ""),
      ),
    );
  };

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  const eliminarPresupuesto = async (id) => {
    try {
      const res = await fetch(`${API_URL}/presupuestos/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      toast.success(data.message || "Presupuesto eliminado");
      cargarPresupuestos();
    } catch (error) {
      toast.error("Error al eliminar el presupuesto: " + error.message);
    }
  };

  const confirmarEliminar = (id) => {
    const toastId = `eliminar-presupuesto-${id}`;
    if (toast.isActive(toastId)) return;

    const presupuesto = presupuestos.find((p) => p.id === id);
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">
            ¿Seguro que querés eliminar el presupuesto de "
            <strong>{presupuesto.cliente_nombre}</strong>"?
          </p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                eliminarPresupuesto(id);
                closeToast();
              }}
            >
              Eliminar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={closeToast}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { toastId, autoClose: false, closeOnClick: false, draggable: false },
    );
  };

  const convertirAVenta = async (id) => {
    try {
      const presupuesto = presupuestos.find((p) => p.id === id);

      const res = await fetch(
        `${API_URL}/presupuestos/${id}/convertir`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medio_pago: presupuesto.medio_pago ?? "efectivo",
            monto_efectivo: presupuesto.monto_efectivo ?? null,
            monto_transferencia: presupuesto.monto_transferencia ?? null,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        const resDetalle = await fetch(
          `${API_URL}/presupuestos/${id}`,
        );
        const detalle = await resDetalle.json();

        setTicketData({
          id: data.venta_id,
          fecha: new Date().toISOString(),
          productos: detalle.map((d) => ({
            nombre: d.nombre,
            precio: d.precio,
            cantidad: d.cantidad,
          })),
          total: presupuesto.total,
          medio_pago: presupuesto.medio_pago ?? "efectivo",
          monto_efectivo: presupuesto.monto_efectivo ?? null,
          monto_transferencia: presupuesto.monto_transferencia ?? null,
        });

        cargarPresupuestos();
      } else {
        toast.error(data.message || "Error al convertir");
      }
    } catch (error) {
      toast.error("Error al convertir el presupuesto: " + error.message);
    }
  };

  const confirmarConvertir = (id) => {
    const toastId = `convertir-presupuesto-${id}`;
    if (toast.isActive(toastId)) return;

    const presupuesto = presupuestos.find((p) => p.id === id);
    const labelMedio =
      presupuesto.medio_pago === "transferencia"
        ? "📲 transferencia"
        : presupuesto.medio_pago === "mix"
          ? "🔀 mix"
          : "💵 efectivo";

    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-1">
            ¿Convertir el presupuesto de "
            <strong>{presupuesto.cliente_nombre}</strong>" en una venta? Se
            descontará el stock.
          </p>
          <p className="mb-2 text-muted" style={{ fontSize: 12 }}>
            Medio de pago: <strong>{labelMedio}</strong>
            {presupuesto.medio_pago === "mix" &&
              presupuesto.monto_efectivo != null && (
                <span>
                  {" "}
                  (Ef: $
                  {Number(presupuesto.monto_efectivo).toLocaleString("es-AR")} /
                  Tr: $
                  {Number(presupuesto.monto_transferencia).toLocaleString(
                    "es-AR",
                  )}
                  )
                </span>
              )}
          </p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-success btn-sm"
              onClick={() => {
                convertirAVenta(id);
                closeToast();
              }}
            >
              Confirmar
            </button>
            <button className="btn btn-secondary btn-sm" onClick={closeToast}>
              Cancelar
            </button>
          </div>
        </div>
      ),
      { toastId, autoClose: false, closeOnClick: false, draggable: false },
    );
  };

  const ordenarPor = (columna) => {
    const direccion =
      orden.columna === columna && orden.direccion === "asc" ? "desc" : "asc";
    const ordenados = [...presupuestos].sort((a, b) => {
      const valA = a[columna] ?? "";
      const valB = b[columna] ?? "";
      if (typeof valA === "string") {
        return direccion === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return direccion === "asc" ? valA - valB : valB - valA;
    });
    setPresupuestos(ordenados);
    setOrden({ columna, direccion });
  };

  const iconoOrden = (columna) => {
    if (orden.columna !== columna)
      return <span style={{ opacity: 0.3 }}>↕</span>;
    return orden.direccion === "asc" ? "▲" : "▼";
  };

  const estadoBadge = (estado) => {
    if (estado === "convertido") {
      return (
        <span
          className="badge bg-success d-flex align-items-center gap-1"
          style={{ width: "fit-content" }}
        >
          <CheckCircle size={11} /> Convertido
        </span>
      );
    }
    return (
      <span
        className="badge bg-secondary d-flex align-items-center gap-1"
        style={{ width: "fit-content" }}
      >
        <Clock size={11} /> Pendiente
      </span>
    );
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "-";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const verTicket = async (presupuesto) => {
    const res = await fetch(
      `${API_URL}/presupuestos/${presupuesto.id}`,
    );
    const detalle = await res.json();
    setTicketData({
      id: presupuesto.venta_id,
      fecha: presupuesto.fecha,
      productos: detalle.map((d) => ({
        nombre: d.nombre,
        precio: d.precio,
        cantidad: d.cantidad,
      })),
      total: presupuesto.total,
      medio_pago: presupuesto.medio_pago ?? "efectivo",
      monto_efectivo: presupuesto.monto_efectivo ?? null,
      monto_transferencia: presupuesto.monto_transferencia ?? null,
    });
  };

  if (presupuestos.length === 0) {
    return (
      <div>
        <BackButton dir="/" />
        <div className="text-center mt-5">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{
              width: 56,
              height: 56,
              background: "rgba(99, 102, 241, 0.12)",
              color: "#6366f1",
            }}
          >
            <ClipboardList size={26} />
          </div>
          <h2 className="fw-bold mb-1">Presupuestos</h2>
          <p className="text-muted mb-4">No hay presupuestos registrados</p>
          <Link
            className="btn btn-success d-inline-flex align-items-center gap-2"
            to="/presupuestos/nuevo"
          >
            <Plus size={18} /> Nuevo presupuesto
          </Link>
        </div>
      </div>
    );
  }

  const presupuestosFiltrados = presupuestos.filter(
    (p) =>
      (p.cliente_nombre ?? "")
        .toLowerCase()
        .includes(busquedaFiltro.toLowerCase()) ||
      p.estado.toLowerCase().includes(busquedaFiltro.toLowerCase()),
  );

  return (
    <div>
      {ticketData && (
        <TicketModal ticket={ticketData} onClose={() => setTicketData(null)} />
      )}

      <BackButton dir="/" />

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{
              width: 42,
              height: 42,
              flexShrink: 0,
              background: "rgba(99, 102, 241, 0.12)",
              color: "#6366f1",
            }}
          >
            <ClipboardList size={20} />
          </div>
          <div>
            <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
              Presupuestos
            </h2>
            <small className="text-muted">
              {presupuestos.length} presupuesto
              {presupuestos.length !== 1 ? "s" : ""} registrado
              {presupuestos.length !== 1 ? "s" : ""}
            </small>
          </div>
        </div>

        <Link
          className="btn btn-success d-flex align-items-center gap-2"
          to="/presupuestos/nuevo"
        >
          <Plus size={16} /> Nuevo presupuesto
        </Link>
      </div>

      <SearchBar
        value={busquedaFiltro}
        onChange={setBusquedaFiltro}
        placeholder="Buscar por cliente..."
      />

      {/* Tabla */}
      <div
        className="card shadow-sm"
        style={{
          borderRadius: 12,
          overflow: "hidden",
          maxHeight: 560,
          overflowY: "auto",
        }}
      >
        <table className="table mb-0">
          <thead>
            <tr>
              {[
                ["cliente_nombre", "Cliente"],
                ["fecha", "Fecha"],
                ["medio_pago", "Pago"],
                ["total", "Total"],
                ["estado", "Estado"],
              ].map(([col, label]) => (
                <th
                  key={col}
                  onClick={() => ordenarPor(col)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  className={col === "total" ? "text-end" : ""}
                >
                  <span className="d-flex align-items-center gap-1">
                    {label}{" "}
                    <span style={{ fontSize: 11 }}>{iconoOrden(col)}</span>
                  </span>
                </th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {presupuestosFiltrados.map((presupuesto) => (
              <tr
                key={presupuesto.id}
                className={
                  presupuesto.estado === "convertido" ? "table-success" : ""
                }
              >
                <td>
                  <span className="fw-semibold">
                    {presupuesto.cliente_nombre || (
                      <span className="text-muted fst-italic">Sin nombre</span>
                    )}
                  </span>
                </td>
                <td>{formatFecha(presupuesto.fecha)}</td>

                {/* Pago — badge con color igual a FacturacionDia */}
                <td>
                  <span
                    className={`badge ${
                      !presupuesto.medio_pago ||
                      presupuesto.medio_pago === "efectivo"
                        ? "bg-success"
                        : presupuesto.medio_pago === "transferencia"
                          ? "bg-primary"
                          : "bg-warning text-dark"
                    }`}
                    style={{ fontSize: 11 }}
                  >
                    {presupuesto.medio_pago === "transferencia"
                      ? "📲 Transfer."
                      : presupuesto.medio_pago === "mix"
                        ? "🔀 Mix"
                        : "💵 Efectivo"}
                  </span>
                </td>

                {/* Total — con desglose mix igual a FacturacionDia */}
                <td className="fw-bold text-success">
                  ${Number(presupuesto.total).toLocaleString("es-AR")}
                  {presupuesto.medio_pago === "mix" && (
                    <div className="d-flex flex-column align-items-end gap-1 mt-1">
                      <span
                        className="badge bg-success bg-opacity-75"
                        style={{ fontSize: 10 }}
                      >
                        💵 $
                        {Number(presupuesto.monto_efectivo).toLocaleString(
                          "es-AR",
                        )}
                      </span>
                      <span
                        className="badge bg-primary bg-opacity-75"
                        style={{ fontSize: 10 }}
                      >
                        📲 $
                        {Number(presupuesto.monto_transferencia).toLocaleString(
                          "es-AR",
                        )}
                      </span>
                    </div>
                  )}
                </td>

                <td>{estadoBadge(presupuesto.estado)}</td>

                <td>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/presupuestos/editar/${presupuesto.id}`}
                      className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <Pencil size={13} /> Ver/Editar
                    </Link>
                    {presupuesto.estado !== "convertido" && (
                      <button
                        className="btn btn-success btn-sm d-flex align-items-center gap-1"
                        onClick={() => confirmarConvertir(presupuesto.id)}
                      >
                        <ShoppingCart size={13} /> Convertir
                      </button>
                    )}
                    {presupuesto.estado === "convertido" && (
                      <button
                        className="btn btn-sm d-flex align-items-center gap-1"
                        style={{
                          background: "#4f46e5",
                          color: "#fff",
                          border: "none",
                        }}
                        onClick={() => verTicket(presupuesto)}
                      >
                        <Printer size={13} /> Ver ticket
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                      onClick={() => confirmarEliminar(presupuesto.id)}
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Presupuestos;
