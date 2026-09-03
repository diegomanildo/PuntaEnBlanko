import { useEffect, useState } from "react";
import {
  HardDriveDownload,
  FolderOpen,
  CheckCircle2,
  Save,
  RotateCcw,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import BackButton from "../components/BackButton";
import API_URL from "../config";
import Spinner from "../components/Spinner";

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const unidades = ["B", "KB", "MB", "GB", "T"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const valor = bytes / Math.pow(1024, i);
  return `${valor.toFixed(valor >= 10 || i === 0 ? 0 : 1)} ${unidades[i]}`;
};

function Backups() {
  const [carpeta, setCarpeta] = useState(null);
  const [carpetaDefault, setCarpetaDefault] = useState(null);
  const [automatico, setAutomatico] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [ultimoBackup, setUltimoBackup] = useState(null);
  const [maxBackups, setMaxBackups] = useState(1000);
  const [tamanoDB, setTamanoDB] = useState(0); // bytes
  const [ultimoBackupFecha, setUltimoBackupFecha] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [resConfig, rutaDefault, resTamano] = await Promise.all([
          fetch(`${API_URL}/backups/config`).then((r) => r.json()),
          window.electronAPI?.obtenerRutaDefaultBackups?.() ?? null,
          fetch(`${API_URL}/backups/db-size`)
            .then((r) => r.json())
            .catch(() => ({ tamano: 0 })),
        ]);

        setCarpetaDefault(rutaDefault);
        setMaxBackups(resConfig.maxBackups ?? 1000);
        setTamanoDB(resTamano.tamano ?? 0);
        setUltimoBackupFecha(resConfig.ultimoBackup ?? null);

        if (resConfig.destino) {
          setCarpeta(resConfig.destino);
        } else if (rutaDefault) {
          // Primera vez: configurar la ruta default automáticamente
          setCarpeta(rutaDefault);
          await guardarConfig({ destino: rutaDefault });
        }

        setAutomatico(!!resConfig.automatico);
      } catch (err) {
        console.error("Error cargando configuración de backups:", err);
      } finally {
        setCargando(false);
      }
    };

    init();
  }, []);

  const guardarConfig = async (cambios) => {
    try {
      const res = await fetch(`${API_URL}/backups/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      return await res.json();
    } catch (err) {
      toast.error("No se pudo guardar la configuración");
      throw err;
    }
  };

  const elegirCarpeta = async () => {
    if (!window.electronAPI?.seleccionarCarpeta) {
      toast.error(
        "Esta función solo está disponible en la aplicación de escritorio",
      );
      return;
    }
    const ruta = await window.electronAPI.seleccionarCarpeta();
    if (ruta) {
      setCarpeta(ruta);
      setUltimoBackup(null);
      await guardarConfig({ destino: ruta });
      toast.success("Carpeta de destino actualizada");
    }
  };

  const restaurarDefault = async () => {
    if (!carpetaDefault) return;
    setCarpeta(carpetaDefault);
    setUltimoBackup(null);
    await guardarConfig({ destino: carpetaDefault });
    toast.success("Carpeta restaurada a la predeterminada");
  };

  const toggleAutomatico = async () => {
    const nuevoValor = !automatico;
    setAutomatico(nuevoValor);
    await guardarConfig({ automatico: nuevoValor });
    toast.success(
      nuevoValor
        ? "Backup automático activado"
        : "Backup automático desactivado",
    );
  };

  const crearBackup = async () => {
    if (!carpeta) {
      toast.warning("Primero elegí una carpeta de destino");
      return;
    }

    setGenerando(true);
    try {
      const res = await fetch(`${API_URL}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destino: carpeta }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al crear el backup");

      setUltimoBackup(data);
      setUltimoBackupFecha(new Date().toISOString());
      toast.success("Backup creado correctamente");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerando(false);
    }
  };

  const diasDesde = (fechaISO) => {
    if (!fechaISO) return null;
    const diffMs = Date.now() - new Date(fechaISO).getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const cambiarMaxBackups = async (valor) => {
    let num = Number(valor);
    if (isNaN(num) || num < 0) num = 0;
    if (num > 100000) num = 100000; // límite razonable para evitar problemas de rendimiento
    num = Math.floor(num);

    setMaxBackups(num);
    await guardarConfig({ maxBackups: num });
    toast.success(
      num === 0
        ? "Sin límite de copias guardadas"
        : `Se conservarán las últimas ${num} copias`,
    );
  };

  const verBackups = async () => {
    if (!window.electronAPI?.abrirCarpetaBackups) {
      toast.error(
        "Esta función solo está disponible en la aplicación de escritorio",
      );
      return;
    }
    if (!carpeta) {
      toast.warning("Todavía no hay una carpeta configurada");
      return;
    }
    await window.electronAPI.abrirCarpetaBackups(carpeta);
  };

  if (cargando) {
    return (
      <div>
        <BackButton dir="/" />
        <Spinner text="Cargando configuración..." />
      </div>
    );
  }

  return (
    <div>
      <BackButton dir="/" />

      <div className="d-flex align-items-center gap-3 mb-2">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{
            width: 36,
            height: 36,
            flexShrink: 0,
            background: "rgba(25, 135, 84, 0.12)",
            color: "#198754",
          }}
        >
          <HardDriveDownload size={18} />
        </div>
        <div>
          <h2 className="fw-bold mb-0" style={{ fontSize: "1.05rem" }}>
            Copias de seguridad
          </h2>
          <small className="text-muted" style={{ fontSize: "0.78rem" }}>
            Guardá una copia de la base de datos en tu computadora
          </small>
        </div>
      </div>

      {(() => {
        const dias = diasDesde(ultimoBackupFecha);
        if (dias === null) {
          return (
            <div
              className="d-flex align-items-center gap-3 px-3 py-2 mb-3 mx-auto"
              style={{
                borderRadius: 10,
                background: "rgba(255, 193, 7, 0.08)",
                border: "1px solid rgba(255, 193, 7, 0.3)",
                maxWidth: 560,
                width: "100%",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🟡</span>
              <p className="mb-0 text-muted" style={{ fontSize: "0.78rem" }}>
                Todavía no hiciste ninguna copia de seguridad
              </p>
            </div>
          );
        }
        if (dias >= 7) {
          return (
            <div
              className="d-flex align-items-center gap-3 px-3 py-2 mb-3"
              style={{
                borderRadius: 10,
                background: "rgba(220, 53, 69, 0.08)",
                border: "1px solid rgba(220, 53, 69, 0.25)",
                maxWidth: 560,
                width: "100%",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>🔴</span>
              <p className="mb-0 text-muted" style={{ fontSize: "0.78rem" }}>
                Hace {dias} días que no hacés una copia de seguridad
              </p>
            </div>
          );
        }
        return null;
      })()}

      <div className="d-flex flex-column align-items-center">
        <div
          className="card p-3"
          style={{ borderRadius: 14, maxWidth: 560, width: "100%" }}
        >
          <p className="mb-3" style={{ fontSize: "0.85rem" }}>
            Hacé una copia de tus datos para tenerlos a salvo. Cada copia se
            guarda en una carpeta con la fecha y hora del momento en que se
            generó.
          </p>

          {/* Paso 1 */}
          <div className="d-flex align-items-start gap-3 mb-2">
            <span className="backup-step-number">1</span>
            <div className="flex-grow-1">
              <p className="mb-2 fw-semibold" style={{ fontSize: "0.85rem" }}>
                Carpeta donde se guardan las copias
              </p>
              <div className="d-flex gap-2 flex-wrap mb-2">
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={verBackups}
                >
                  <Eye size={16} />
                  Ver backups
                </button>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                    onClick={elegirCarpeta}
                  >
                    <FolderOpen size={16} />
                    Cambiar carpeta
                  </button>

                  {carpetaDefault && carpeta !== carpetaDefault && (
                    <button
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                      onClick={restaurarDefault}
                    >
                      <RotateCcw size={14} />
                      Usar predeterminada
                    </button>
                  )}
                </div>
              </div>

              {carpeta && (
                <div
                  className="mt-2 px-3 py-2 backup-ruta"
                  style={{
                    borderRadius: 8,
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                  }}
                >
                  📁 {carpeta}
                </div>
              )}
            </div>
          </div>

          <div className="backup-separador my-1" />

          {/* Paso 2 - Backup automático */}
          <div className="d-flex align-items-start gap-3 mb-2">
            <span className="backup-step-number">2</span>
            <div className="flex-grow-1">
              <p className="mb-1 fw-semibold" style={{ fontSize: "0.85rem" }}>
                Backup automático
              </p>
              <p className="mb-2 text-muted" style={{ fontSize: "0.75rem" }}>
                Si está activado, se crea una copia automáticamente cada vez que
                se abre el programa.
              </p>

              <button
                onClick={toggleAutomatico}
                className="backup-toggle"
                style={{
                  background: automatico ? "#198754" : "rgba(120,120,120,0.25)",
                }}
              >
                <div
                  className="backup-toggle-circle"
                  style={{
                    transform: automatico
                      ? "translateX(18px)"
                      : "translateX(0px)",
                  }}
                />
              </button>
              <span
                className="ms-2 fw-semibold"
                style={{ fontSize: "0.78rem" }}
              >
                {automatico ? "Activado" : "Desactivado"}
              </span>
            </div>
          </div>

          <div className="backup-separador my-1" />

          {/* Paso 3 - Límite de copias */}
          <div className="d-flex align-items-start gap-3 mb-2">
            <span className="backup-step-number">3</span>
            <div className="flex-grow-1">
              <p className="mb-1 fw-semibold" style={{ fontSize: "0.85rem" }}>
                Cantidad de copias a conservar
              </p>
              <p className="mb-2 text-muted" style={{ fontSize: "0.75rem" }}>
                Cuando se supere este número, se eliminarán automáticamente las
                copias más antiguas. Poné 0 para no tener límite.
              </p>

              <input
                type="number"
                min={0}
                step={1}
                className="form-control form-control-sm"
                style={{ maxWidth: 220 }}
                value={maxBackups}
                onChange={(e) => setMaxBackups(e.target.value)}
                onBlur={(e) => cambiarMaxBackups(e.target.value)}
              />

              {tamanoDB > 0 ? (
                maxBackups > 0 ? (
                  <p
                    className="mt-2 mb-0 text-muted"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Espacio estimado al llegar al máximo de copias:{" "}
                    <strong>{formatBytes(tamanoDB * maxBackups)}</strong> (
                    {formatBytes(tamanoDB)} por copia.)
                  </p>
                ) : (
                  <p
                    className="mt-2 mb-0 text-muted"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Sin límite: el espacio crecerá indefinidamente (
                    {formatBytes(tamanoDB)} por copia.)
                  </p>
                )
              ) : (
                <></>
              )}
            </div>
          </div>

          <div className="backup-separador my-1" />

          {/* Paso 4 - Crear manualmente */}
          <div className="d-flex align-items-start gap-3">
            <span className="backup-step-number">4</span>
            <div className="flex-grow-1">
              <p className="mb-2 fw-semibold" style={{ fontSize: "0.85rem" }}>
                Crear copia ahora
              </p>
              <button
                className="btn btn-sm btn-success d-flex align-items-center justify-content-center gap-2"
                onClick={crearBackup}
                disabled={!carpeta || generando}
                style={{ padding: "7px 16px" }}
              >
                <Save size={16} />
                {generando ? "Generando..." : "Crear copia de seguridad"}
              </button>

              {ultimoBackup && (
                <div className="d-flex align-items-center gap-2 mt-3 px-3 py-2 backup-exito">
                  <CheckCircle2
                    size={16}
                    className="text-success flex-shrink-0"
                  />
                  <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                    Guardado en la carpeta{" "}
                    <strong>{ultimoBackup.carpeta}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Backups;
