import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Users, Save } from "lucide-react";
import { toast } from "react-toastify";
import BackButton from "../../components/UI/BackButton";
import {
  parsePhoneNumberWithError,
  isValidPhoneNumber,
} from "libphonenumber-js";
import API_URL from "../../config";

/** Formatea CUIT automáticamente mientras el usuario escribe: XX-XXXXXXXX-X */
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
    const phone = parsePhoneNumberWithError(valor, "AR");
    if (phone && phone.isValid()) return phone.formatNational();
  } catch {
    // si no se puede parsear todavía, devolver el valor limpio
  }
  return valor;
};

function NuevoCliente() {
  const navigate = useNavigate();
  const location = useLocation();
  const backDir = location.state?.backDir;

  const [form, setForm] = useState({
    razon_social: "",
    domicilio: "",
    localidad: "",
    cuit: "",
    telefono: "",
    mail: "",
  });
  const [errores, setErrores] = useState({});

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: null }));
  };

  const handleCuit = (e) => {
    const formateado = formatearCuit(e.target.value);
    handleChange("cuit", formateado);
  };

  const guardar = async () => {
    const nuevosErrores = {};
    if (!form.razon_social.trim())
      nuevosErrores.razon_social = "La razón social es obligatoria";
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
      const res = await fetch(`${API_URL}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Cliente creado");
        navigate("/clientes");
      } else {
        toast.error(data.message || "Error al crear cliente");
      }
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  };

  return (
    <div>
      <BackButton dir={backDir} />

      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{
            width: 42,
            height: 42,
            flexShrink: 0,
            background: "rgba(249, 115, 22, 0.12)",
            color: "#f97316",
          }}
        >
          <Users size={20} />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.2rem" }}>
            Nuevo cliente
          </h2>
          <small className="text-muted">Completá los datos del cliente</small>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-7">
          <div className="card p-4" style={{ borderRadius: 12 }}>
            {/* Razón social */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: 13 }}
              >
                Razón social <span className="text-danger">*</span>
              </label>
              <input
                className={`form-control ${errores.razon_social ? "is-invalid" : ""}`}
                placeholder="Ej: Empresa S.A."
                value={form.razon_social}
                onChange={(e) => handleChange("razon_social", e.target.value)}
                autoFocus
              />
              {errores.razon_social && (
                <div className="invalid-feedback">{errores.razon_social}</div>
              )}
            </div>

            {/* CUIT */}
            <div className="mb-3">
              <label
                className="form-label fw-semibold"
                style={{ fontSize: 13 }}
              >
                CUIT <span className="text-danger">*</span>
              </label>
              <input
                className={`form-control ${errores.cuit ? "is-invalid" : ""}`}
                placeholder="XX-XXXXXXXX-X"
                value={form.cuit}
                onChange={handleCuit}
                inputMode="numeric"
                maxLength={13}
              />
              {errores.cuit ? (
                <div className="invalid-feedback">{errores.cuit}</div>
              ) : (
                <small className="text-muted" style={{ fontSize: 11 }}>
                  Formato: XX-XXXXXXXX-X (se formatea automáticamente)
                </small>
              )}
            </div>

            {/* Domicilio + Localidad en fila */}
            <div className="row g-3 mb-3">
              <div className="col-md-7">
                <label className="form-label" style={{ fontSize: 13 }}>
                  Domicilio
                </label>
                <input
                  className="form-control"
                  placeholder="Calle y número"
                  value={form.domicilio}
                  onChange={(e) => handleChange("domicilio", e.target.value)}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label" style={{ fontSize: 13 }}>
                  Localidad
                </label>
                <input
                  className="form-control"
                  placeholder="Ciudad / Partido"
                  value={form.localidad}
                  onChange={(e) => handleChange("localidad", e.target.value)}
                />
              </div>
            </div>

            {/* Teléfono + Mail en fila */}
            <div className="row g-3 mb-4">
              <div className="col-md-5">
                <label className="form-label" style={{ fontSize: 13 }}>
                  Teléfono
                </label>
                <input
                  className={`form-control ${errores.telefono ? "is-invalid" : ""}`}
                  placeholder="Ej: 11 2345-6789"
                  value={form.telefono}
                  onChange={(e) => {
                    const formateado = formatearTelefono(e.target.value);
                    handleChange("telefono", formateado);
                  }}
                  inputMode="tel"
                />
                {errores.telefono && (
                  <div className="invalid-feedback d-block">
                    {errores.telefono}
                  </div>
                )}
              </div>
              <div className="col-md-7">
                <label className="form-label" style={{ fontSize: 13 }}>
                  Mail
                </label>
                <input
                  type="email"
                  className={`form-control ${errores.mail ? "is-invalid" : ""}`}
                  placeholder="correo@ejemplo.com"
                  value={form.mail}
                  onChange={(e) => handleChange("mail", e.target.value)}
                />
                {errores.mail && (
                  <div className="invalid-feedback d-block">{errores.mail}</div>
                )}
              </div>
            </div>

            <div className="d-flex gap-3">
              <button
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={guardar}
              >
                <Save size={16} /> Guardar cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NuevoCliente;
