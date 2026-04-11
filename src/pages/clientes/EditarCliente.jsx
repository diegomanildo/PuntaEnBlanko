/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, Save, Link2, Link2Off, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton";
import API_URL from "../../config";

const formatearCuit = (valor) => {
  const soloDigitos = valor.replace(/\D/g, "").slice(0, 11);
  if (soloDigitos.length <= 2) return soloDigitos;
  if (soloDigitos.length <= 10)
    return `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2)}`;
  return `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2, 10)}-${soloDigitos.slice(10)}`;
};

const validarCuit = (cuit) => /^\d{2}-\d{8}-\d{1}$/.test(cuit);

const formatearTelefono = (valor) => {
  try {
    const phone = parsePhoneNumber(valor, "AR");
    if (phone && phone.isValid()) return phone.formatNational();
  } catch {
    // número incompleto, devolver tal cual
  }
  return valor;
};

function EditarCliente() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    razon_social: "",
    domicilio: "",
    localidad: "",
    cuit: "",
    telefono: "",
    mail: "",
  });
  const [errores, setErrores] = useState({});
  const [stats, setStats] = useState({ cantidad_compras: 0, total_gastado: 0, ultima_compra: null });

  const [compras, setCompras] = useState([]);
  const [mostrarCompras, setMostrarCompras] = useState(false);

  const [ventaIdInput, setVentaIdInput] = useState("");
  const [vinculando, setVinculando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const [resCliente, resCompras] = await Promise.all([
        fetch(`${API_URL}/clientes/${id}`),
        fetch(`${API_URL}/clientes/${id}/compras`),
      ]);
      const cliente = await resCliente.json();
      const historial = await resCompras.json();

      setForm({
        razon_social: cliente.razon_social || "",
        domicilio: cliente.domicilio || "",
        localidad: cliente.localidad || "",
        cuit: cliente.cuit || "",
        telefono: cliente.telefono || "",
        mail: cliente.mail || "",
      });
      setStats({
        cantidad_compras: cliente.cantidad_compras,
        total_gastado: cliente.total_gastado,
        ultima_compra: cliente.ultima_compra,
      });
      setCompras(historial);
    };
    cargar();
  }, [id]);

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  const guardar = async () => {
    const nuevosErrores = {};
    if (!form.razon_social.trim()) nuevosErrores.razon_social = "La razón social es obligatoria";
    if (!form.cuit.trim()) {
      nuevosErrores.cuit = "El CUIT es obligatorio";
    } else if (!validarCuit(form.cuit.trim())) {
      nuevosErrores.cuit = "Formato inválido. Debe ser XX-XXXXXXXX-X";
    }
    if (form.telefono && !isValidPhoneNumber(form.telefono.trim(), "AR")) {
      nuevosErrores.telefono = "Teléfono inválido. Ej: 11 2345-6789";
    }
    if (form.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mail.trim())) {
      nuevosErrores.mail = "El mail no tiene un formato válido";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      const res = await fetch(`${API_URL}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Cliente actualizado");
        navigate("/clientes");
      } else {
        toast.error(data.message || "Error al actualizar cliente");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  const vincularVenta = async () => {
    const ventaId = parseInt(ventaIdInput);
    if (!ventaId || isNaN(ventaId)) return toast.warning("Ingresá un ID de venta válido");

    if (compras.some((c) => c.id === ventaId)) {
      return toast.warning("Esa venta ya está vinculada a este cliente");
    }

    setVinculando(true);
    try {
      const res = await fetch(`${API_URL}/clientes/${id}/vincular-venta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venta_id: ventaId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Venta vinculada");
        setVentaIdInput("");
        const [resCompras, resCliente] = await Promise.all([
          fetch(`${API_URL}/clientes/${id}/compras`),
          fetch(`${API_URL}/clientes/${id}`),
        ]);
        setCompras(await resCompras.json());
        const cli = await resCliente.json();
        setStats({ cantidad_compras: cli.cantidad_compras, total_gastado: cli.total_gastado, ultima_compra: cli.ultima_compra });
      } else {
        toast.error(data.message || "Error al vincular venta");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setVinculando(false);
    }
  };

  const desvincularVenta = async (ventaId) => {
    try {
      const res = await fetch(`${API_URL}/clientes/desvincular-venta/${ventaId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Venta desvinculada");
        setCompras((prev) => prev.filter((c) => c.id !== ventaId));
        setStats((prev) => ({
          ...prev,
          cantidad_compras: Math.max(0, prev.cantidad_compras - 1),
        }));
      } else {
        toast.error(data.message || "Error al desvincular");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  const confirmarDesvincular = (ventaId) => {
    const toastId = `desvincular-venta-${ventaId}`;
    if (toast.isActive(toastId)) return;
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">¿Desvincular la venta <strong>#{ventaId}</strong> de este cliente?</p>
          <div className="d-flex gap-2">
            <button className="btn btn-warning btn-sm" onClick={() => { desvincularVenta(ventaId); closeToast(); }}>
              Desvincular
            </button>
            <button className="btn btn-secondary btn-sm" onClick={closeToast}>Cancelar</button>
          </div>
        </div>
      ),
      { toastId, autoClose: false, closeOnClick: false, draggable: false },
    );
  };

  const formatFechaHora = (fechaStr) => {
    if (!fechaStr) return "-";
    return new Date(fechaStr + "Z").toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") guardar();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [form, errores]);

  return (
    <div>
      <BackButton dir="/clientes" />

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{ width: 42, height: 42, flexShrink: 0, background: "rgba(249, 115, 22, 0.12)", color: "#f97316" }}
        >
          <Users size={20} />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>Editar cliente</h2>
          <small className="text-muted">{form.razon_social || "Cargando..."}</small>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-1" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Compras totales
            </p>
            <p className="fw-bold mb-0" style={{ fontSize: "1.6rem", lineHeight: 1.1 }}>
              {stats.cantidad_compras}
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-1" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Total gastado
            </p>
            <p className="fw-bold mb-0 text-success" style={{ fontSize: "1.6rem", lineHeight: 1.1 }}>
              ${Number(stats.total_gastado).toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card p-3" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-1" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Última compra
            </p>
            <p className="fw-bold mb-0" style={{ fontSize: "1rem", lineHeight: 1.3 }}>
              {stats.ultima_compra
                ? formatFechaHora(stats.ultima_compra)
                : <span className="text-muted fst-italic fw-normal" style={{ fontSize: 13 }}>Sin compras</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Formulario */}
        <div className="col-md-6">
          <div className="card p-4" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-3" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Datos del cliente
            </p>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                Razón social <span className="text-danger">*</span>
              </label>
              <input
                className={`form-control ${errores.razon_social ? "is-invalid" : ""}`}
                value={form.razon_social}
                onChange={(e) => handleChange("razon_social", e.target.value)}
              />
              {errores.razon_social && <div className="invalid-feedback">{errores.razon_social}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                CUIT <span className="text-danger">*</span>
              </label>
              <input
                className={`form-control ${errores.cuit ? "is-invalid" : ""}`}
                placeholder="XX-XXXXXXXX-X"
                value={form.cuit}
                onChange={(e) => handleChange("cuit", formatearCuit(e.target.value))}
                inputMode="numeric"
                maxLength={13}
              />
              {errores.cuit ? (
                <div className="invalid-feedback">{errores.cuit}</div>
              ) : (
                <small className="text-muted" style={{ fontSize: 11 }}>Formato: XX-XXXXXXXX-X</small>
              )}
            </div>

            <div className="row g-2 mb-3">
              <div className="col-7">
                <label className="form-label" style={{ fontSize: 13 }}>Domicilio</label>
                <input
                  className="form-control"
                  value={form.domicilio}
                  onChange={(e) => handleChange("domicilio", e.target.value)}
                />
              </div>
              <div className="col-5">
                <label className="form-label" style={{ fontSize: 13 }}>Localidad</label>
                <input
                  className="form-control"
                  value={form.localidad}
                  onChange={(e) => handleChange("localidad", e.target.value)}
                />
              </div>
            </div>

            <div className="row g-2 mb-4">
              <div className="col-5">
                <label className="form-label" style={{ fontSize: 13 }}>Teléfono</label>
                <input
                  className={`form-control ${errores.telefono ? "is-invalid" : ""}`}
                  placeholder="11 2345-6789"
                  value={form.telefono}
                  onChange={(e) => handleChange("telefono", formatearTelefono(e.target.value))}
                  inputMode="tel"
                />
                {errores.telefono && <div className="invalid-feedback d-block">{errores.telefono}</div>}
              </div>
              <div className="col-7">
                <label className="form-label" style={{ fontSize: 13 }}>Mail</label>
                <input
                  type="email"
                  className={`form-control ${errores.mail ? "is-invalid" : ""}`}
                  placeholder="correo@ejemplo.com"
                  value={form.mail}
                  onChange={(e) => handleChange("mail", e.target.value)}
                />
                {errores.mail && <div className="invalid-feedback d-block">{errores.mail}</div>}
              </div>
            </div>

            <button className="btn btn-success d-flex align-items-center gap-2" onClick={guardar}>
              <Save size={16} /> Guardar cambios
            </button>
          </div>
        </div>

        {/* Panel de compras + vincular */}
        <div className="col-md-6">
          <div className="card p-4 mb-3" style={{ borderRadius: 12 }}>
            <p className="text-muted mb-3" style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Vincular compra existente
            </p>
            <div className="d-flex gap-2">
              <input
                type="number"
                className="form-control"
                placeholder="ID de venta (ej: 42)"
                value={ventaIdInput}
                onChange={(e) => setVentaIdInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && vincularVenta()}
                min={1}
              />
              <button
                className="btn d-flex align-items-center gap-1"
                style={{ background: "#6366f1", color: "#fff", border: "none", whiteSpace: "nowrap" }}
                onClick={vincularVenta}
                disabled={vinculando}
              >
                <Link2 size={15} /> Vincular
              </button>
            </div>
            <small className="text-muted mt-2 d-block" style={{ fontSize: 11 }}>
              Ingresá el número de ID de la venta que querés asociar a este cliente.
            </small>
          </div>

          <div className="card" style={{ borderRadius: 12 }}>
            <div
              className="card-header d-flex align-items-center justify-content-between"
              style={{ background: "transparent", cursor: "pointer", borderBottom: mostrarCompras ? undefined : "none" }}
              onClick={() => setMostrarCompras((v) => !v)}
            >
              <div className="d-flex align-items-center gap-2">
                <ShoppingBag size={15} style={{ color: "#10b981" }} />
                <span className="fw-semibold" style={{ fontSize: 13 }}>Historial de compras</span>
                <span className="badge bg-secondary">{compras.length}</span>
              </div>
              {mostrarCompras ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
            </div>

            {mostrarCompras && (
              <div className="card-body p-0" style={{ maxHeight: 320, overflowY: "auto" }}>
                {compras.length === 0 ? (
                  <div className="d-flex align-items-center gap-2 p-4 text-muted" style={{ fontSize: 13 }}>
                    <ShoppingBag size={16} strokeWidth={1.5} />
                    Sin compras registradas aún.
                  </div>
                ) : (
                  <table className="table table-sm mb-0" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Pago</th>
                        <th className="text-end">Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {compras.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <span className="text-muted">#</span>
                            <span className="fw-bold">{v.id}</span>
                          </td>
                          <td style={{ fontSize: 11 }}>{formatFechaHora(v.fecha)}</td>
                          <td>
                            <span
                              className={`badge ${
                                v.medio_pago === "efectivo" ? "bg-success"
                                : v.medio_pago === "transferencia" ? "bg-primary"
                                : "bg-warning text-dark"
                              }`}
                              style={{ fontSize: 10 }}
                            >
                              {v.medio_pago === "efectivo" ? "💵"
                                : v.medio_pago === "transferencia" ? "📲"
                                : "🔀"}
                            </span>
                          </td>
                          <td className="text-end fw-bold text-success">
                            ${Number(v.total).toLocaleString("es-AR")}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-warning d-flex align-items-center"
                              style={{ padding: "2px 6px" }}
                              title="Desvincular venta"
                              onClick={() => confirmarDesvincular(v.id)}
                            >
                              <Link2Off size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditarCliente;