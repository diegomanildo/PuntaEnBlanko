const COLORES = [
  { valor: null,     label: "Sin color", bg: "transparent", border: "#aaa" },
  { valor: "blue",   label: "Azul",      bg: "#2563EB" },
  { valor: "green",  label: "Verde",     bg: "#16A34A" },
  { valor: "purple", label: "Violeta",   bg: "#7C3AED" },
  { valor: "teal",   label: "Turquesa",  bg: "#0891B2" },
  { valor: "orange", label: "Naranja",   bg: "#EA580C" },
  { valor: "pink",   label: "Rosa",      bg: "#DB2777" },
];

export function ColorPicker({ value, onChange }) {
  return (
    <div>
      <label className="form-label">Color de resaltado</label>
      <div className="d-flex gap-2 flex-wrap">
        {COLORES.map((c) => (
          <button
            key={String(c.valor)}
            type="button"
            title={c.label}
            onClick={() => onChange(c.valor)}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: c.bg,
              border: value === c.valor
                ? "3px solid #333"
                : `2px solid ${c.border ?? "#ccc"}`,
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      {value && (
        <small className="text-muted mt-1 d-block">
          {COLORES.find((c) => c.valor === value)?.label}
        </small>
      )}
    </div>
  );
}