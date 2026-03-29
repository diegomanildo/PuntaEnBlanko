import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function BackButton({ dir }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") return null;

  return (
    <button className="btn-volver" onClick={() => navigate(dir)}>
      <ArrowLeft size={16} /> Volver
    </button>
  );
}

export default BackButton;