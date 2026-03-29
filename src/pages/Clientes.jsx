/* eslint-disable react-hooks/set-state-in-effect */
import { Link } from "react-router-dom";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { PORT } from "../../backend/config";
import { toast } from "react-toastify";
import BackButton from "../components/UI/BackButton";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [orden, setOrden] = useState({ columna: null, direccion: "asc" });
  const [expandido, setExpandido] = useState(null);
  const [compras, setCompras] = useState({});

  const cargarClientes = async () => {
    const res = await fetch(`http://localhost:${PORT}/clientes`);
    const data = await res.json();
    setClientes(data);
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const toggleCompras = async (id) => {
    if (expandido === id) {
      setExpandido(null);
      return;
    }
    if (!compras[id]) {
      const res = await fetch(`http://localhost:${PORT}/clientes/${id}/compras`);
      const data = await res.json();
      setCompras((prev) => ({ ...prev, [id]: data }));
    }
    setExpandido(id);
  };

  const eliminarCliente = async (id) => {
    try {
      const res = await fetch(`http://localhost:${PORT}/clientes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      toast.success(data.message || "Cliente eliminado");
      cargarClientes();
    } catch (error) {
      toast.error("Error al eliminar: " + error.message);
    }
  };

  const confirmarEliminar = (id) => {
    const toastId = `eliminar-cliente-${id}`;
    if (toast.isActive(toastId)) return;

    const cliente = clientes.find((c) => c.id === id);
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">
            ¿Seguro que querés eliminar a{" "}
            <strong>"{cliente.razon_social}"</strong>?
          </p>
          {Number(cliente.cantidad_compras) > 0 && (
            <p className="text-muted mb-2" style={{ fontSize: 12 }}>
              Las {cliente.cantidad_compras} compra(s) asociadas se desvinculará(n) pero no se eliminarán.
            </p>
          )}
          <div className="d-flex gap-2">
            <button
              className="btn btn-danger btn-sm"
              onClick={() => { eliminarCliente(id); closeToast(); }}
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

  const ordenarPor = (columna) => {
    const direccion =
      orden.columna === columna && orden.direccion === "asc" ? "desc" : "asc";
    const ordenados = [...clientes].sort((a, b) => {
      const valA = a[columna] ?? "";
      const valB = b[columna] ?? "";
      if (typeof valA === "string")
        return direccion === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return direccion === "asc" ? valA - valB : valB - valA;
    });
    setClientes(ordenados);
    setOrden({ columna, direccion });
  };

  const iconoOrden = (columna) => {
    if (orden.columna !== columna) return <span style={{ opacity: 0.3 }}>↕</span>;
    return orden.direccion === "asc" ? "▲" : "▼";
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "-";
    return new Date(fechaStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatFechaHora = (fechaStr) => {
    if (!fechaStr) return "-";
    return new Date(fechaStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (clientes.length === 0) {
    return (
      <div>
        <BackButton dir="/" />
        <div className="text-center mt-5">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width: 56, height: 56, background: "rgba(249, 115, 22, 0.12)", color: "#f97316" }}
          >
            <Users size={26} />
          </div>
          <h2 className="fw-bold mb-1">Clientes</h2>
          <p className="text-muted mb-4">No hay clientes registrados</p>
          <Link
            className="btn btn-success d-inline-flex align-items-center gap-2"
            state={{ backDir: "/clientes" }}
            to="/clientes/nuevo"
          >
            <Plus size={18} /> Nuevo cliente
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackButton dir="/" />

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 42, height: 42, flexShrink: 0, background: "rgba(249, 115, 22, 0.12)", color: "#f97316" }}
          >
            <Users size={20} />
          </div>
          <div>
            <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>Clientes</h2>
            <small className="text-muted">
              {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado{clientes.length !== 1 ? "s" : ""}
            </small>
          </div>
        </div>

        <Link
          className="btn btn-success d-flex align-items-center gap-2"
          state={{ backDir: "/clientes" }}
          to="/clientes/nuevo"
        >
          <Plus size={16} /> Nuevo cliente
        </Link>
      </div>

      {/* Tabla */}
      <div
        className="card shadow-sm"
        style={{ borderRadius: 12, overflow: "hidden", maxHeight: 680, overflowY: "auto" }}
      >
        <table className="table mb-0">
          <thead>
            <tr>
              <th style={{ width: 44 }}></th>
              {[
                ["razon_social", "Razón social"],
                ["cuit", "CUIT"],
                ["localidad", "Localidad"],
                ["cantidad_compras", "Compras"],
                ["total_gastado", "Total gastado"],
                ["ultima_compra", "Última compra"],
              ].map(([col, label]) => (
                <th
                  key={col}
                  onClick={() => ordenarPor(col)}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  className={col === "total_gastado" ? "text-end" : ""}
                >
                  <span className="d-flex align-items-center gap-1">
                    {label} <span style={{ fontSize: 11 }}>{iconoOrden(col)}</span>
                  </span>
                </th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <>
                <tr key={cliente.id}>
                  {/* Botón expandir compras */}
                  <td>
                    <button
                      className={`btn btn-sm ${expandido === cliente.id ? "btn-success" : "btn-outline-secondary"} d-flex align-items-center`}
                      style={{ padding: "3px 7px" }}
                      onClick={() => toggleCompras(cliente.id)}
                      title="Ver historial de compras"
                    >
                      {expandido === cliente.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>

                  <td>
                    <div>
                      <span className="fw-semibold">{cliente.razon_social}</span>
                      {cliente.mail && (
                        <div className="text-muted" style={{ fontSize: 11 }}>{cliente.mail}</div>
                      )}
                      {cliente.telefono && (
                        <div className="text-muted" style={{ fontSize: 11 }}>📞 {cliente.telefono}</div>
                      )}
                    </div>
                  </td>

                  <td>
                    <code style={{ fontSize: 12 }}>{cliente.cuit}</code>
                  </td>

                  <td>
                    {cliente.localidad ? (
                      <span>
                        {cliente.localidad}
                        {cliente.domicilio && (
                          <div className="text-muted" style={{ fontSize: 11 }}>{cliente.domicilio}</div>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted fst-italic" style={{ fontSize: 12 }}>—</span>
                    )}
                  </td>

                  <td>
                    <span className="badge bg-secondary">{cliente.cantidad_compras}</span>
                  </td>

                  <td className="fw-bold text-success">
                    ${Number(cliente.total_gastado).toLocaleString("es-AR")}
                  </td>

                  <td style={{ fontSize: 13 }}>
                    {formatFecha(cliente.ultima_compra)}
                  </td>

                  <td>
                    <div className="d-flex gap-2">
                      <Link
                        to={`/clientes/editar/${cliente.id}`}
                        className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                      >
                        <Pencil size={13} /> Editar
                      </Link>
                      <button
                        className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                        onClick={() => confirmarEliminar(cliente.id)}
                      >
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Fila expandible — historial de compras */}
                {expandido === cliente.id && (
                  <tr key={`compras-${cliente.id}`}>
                    <td colSpan={9} style={{ padding: "0 14px 14px 58px", background: "var(--bs-success-bg-subtle)" }}>
                      {!compras[cliente.id] || compras[cliente.id].length === 0 ? (
                        <div className="d-flex align-items-center gap-2 py-3 text-muted" style={{ fontSize: 13 }}>
                          <ShoppingBag size={16} strokeWidth={1.5} />
                          Este cliente no tiene compras registradas aún.
                        </div>
                      ) : (
                        <div className="card mt-2" style={{ borderRadius: 10, overflow: "hidden" }}>
                          <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Medio de pago</th>
                                <th className="text-end">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {compras[cliente.id].map((v) => (
                                <tr key={v.id}>
                                  <td>
                                    <span className="text-muted">#</span>
                                    <span className="fw-bold">{v.id}</span>
                                  </td>
                                  <td>{formatFechaHora(v.fecha)}</td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        v.medio_pago === "efectivo"
                                          ? "bg-success"
                                          : v.medio_pago === "transferencia"
                                          ? "bg-primary"
                                          : "bg-warning text-dark"
                                      }`}
                                      style={{ fontSize: 11 }}
                                    >
                                      {v.medio_pago === "efectivo"
                                        ? "💵 Efectivo"
                                        : v.medio_pago === "transferencia"
                                        ? "📲 Transfer."
                                        : "🔀 Mix"}
                                    </span>
                                    {v.medio_pago === "mix" && (
                                      <div className="d-flex gap-1 mt-1">
                                        <span className="badge bg-success bg-opacity-75" style={{ fontSize: 10 }}>
                                          💵 ${Number(v.monto_efectivo).toLocaleString("es-AR")}
                                        </span>
                                        <span className="badge bg-primary bg-opacity-75" style={{ fontSize: 10 }}>
                                          📲 ${Number(v.monto_transferencia).toLocaleString("es-AR")}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="text-end fw-bold text-success">
                                    ${Number(v.total).toLocaleString("es-AR")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Clientes;