import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/") return null;

  return (
    <button className="btn-volver" onClick={() => navigate(-1)}>
      <ArrowLeft size={16} /> Volver
    </button>
  );
}

export default BackButton;