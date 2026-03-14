import { Link } from "react-router-dom";
import { ShoppingCart, Package, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { PORT } from "../../backend/config";

function Home() {
  const [alertaStock, setAlertaStock] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:${PORT}/productos/stock-bajo`)
      .then((res) => {
        if (!res.ok) throw new Error("Error en la respuesta");
        return res.json();
      })
      .then((data) => setAlertaStock(data))
      .catch((err) => console.error("Error cargando alerta:", err));
  }, []);

  return (
    <div className="text-center">
      <h1 className="mb-5 fw-bold">Punta en Blanko</h1>

      {alertaStock &&
        (alertaStock.stockBajo > 0 || alertaStock.sinStock > 0) && (
          <div className="alert alert-warning col-4 mx-auto mb-4">
            {alertaStock.stockBajo > 0 && (
              <>
                ⚠️ {alertaStock.stockBajo} productos con stock bajo <br />
              </>
            )}
            {alertaStock.sinStock > 0 && (
              <>❌ {alertaStock.sinStock} productos sin stock</>
            )}
          </div>
        )}

      <div className="d-grid gap-4 col-4 mx-auto">
        <Link
          className="btn btn-success btn-lg d-flex align-items-center justify-content-center gap-2"
          to="/venta"
        >
          <ShoppingCart size={24} />
          Nueva Venta
        </Link>

        <Link
          className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2"
          to="/productos"
        >
          <Package size={24} />
          Productos
        </Link>

        <Link
          className="btn btn-warning btn-lg d-flex align-items-center justify-content-center gap-2"
          to="/facturacion"
        >
          <BarChart3 size={24} />
          Facturación del día
        </Link>
      </div>
    </div>
  );
}

export default Home;
