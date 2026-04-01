import { X, Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar...",
}) {
  return (
    <div className="d-flex gap-2 mb-3">
      {/* Input con icono */}
      <div className="input-group">
        {/* <span className="input-group-text bg-white">
          <Search size={18} />
        </span> */}

        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* Botón limpiar */}
      {value && (
        <button
          className="btn btn-outline-secondary d-flex align-items-center gap-1"
          onClick={() => onChange("")}
        >
          <X size={15} /> Limpiar
        </button>
      )}
    </div>
  );
}
