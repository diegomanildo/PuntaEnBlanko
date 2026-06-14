import "./Spinner.css";

/**
 * Spinner
 *
 * Uso para carga de página completa:
 *   <Spinner fullscreen text="Cargando..." />
 *
 * Uso inline (dentro de un botón, una card, etc):
 *   <Spinner size={18} />
 */
function Spinner({ size = 40, fullscreen = true, text }) {
  const spinner = (
    <div className="spinner" style={{ width: size, height: size }} />
  );

  if (!fullscreen) {
    return spinner;
  }

  return (
    <div className="spinner-overlay">
      <div className="spinner-overlay-content">
        {spinner}
        {text && <p className="spinner-text">{text}</p>}
      </div>
    </div>
  );
}

export default Spinner;