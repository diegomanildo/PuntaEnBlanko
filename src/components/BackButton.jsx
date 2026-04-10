import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function BackButton({ dir }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") return null;

  const finalDir = dir ? dir : -1;

  if (finalDir === -1) {
    toast.warn("Error al volver, no se ha especificado una dirección válida.");
    throw new Error("Error al volver, no se ha especificado una dirección válida.");
  }

  return (
    <button className="btn-volver" onClick={() => navigate(finalDir)}>
      <ArrowLeft size={16} /> Volver
    </button>
  );
}

export default BackButton;