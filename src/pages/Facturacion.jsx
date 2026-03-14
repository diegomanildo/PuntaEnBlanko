import { useEffect, useState } from "react";
import { PORT } from "../../backend/config";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";

function Facturacion() {
  const [ventas, setVentas] = useState([]);
  const [total, setTotal] = useState(0);
  const [detalles, setDetalles] = useState({});
  const [ventaAbierta, setVentaAbierta] = useState(null);

  // Ordenamiento
  const [orden, setOrden] = useState({ columna: null, direccion: "asc" });

  const cargarVentas = async () => {
    const res = await fetch(`http://localhost:${PORT}/ventas/hoy`);
    const data = await res.json();

    setVentas(data.ventas);
    setTotal(data.total);
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const toggleDetalle = async (id) => {
    if (ventaAbierta === id) {
      setVentaAbierta(null);
      return;
    }

    if (!detalles[id]) {
      const res = await fetch(`http://localhost:${PORT}/ventas/${id}`);
      const data = await res.json();

      setDetalles({
        ...detalles,
        [id]: data,
      });
    }

    setVentaAbierta(id);
  };

  // Función para ordenar ventas
  const ordenarPor = (columna) => {
    let direccion = "asc";
    if (orden.columna === columna && orden.direccion === "asc") {
      direccion = "desc";
    }

    const ventasOrdenadas = [...ventas].sort((a, b) => {
      if (columna === "fecha") {
        return direccion === "asc"
          ? new Date(a.fecha) - new Date(b.fecha)
          : new Date(b.fecha) - new Date(a.fecha);
      } else {
        return direccion === "asc" ? a[columna] - b[columna] : b[columna] - a[columna];
      }
    });

    setVentas(ventasOrdenadas);
    setOrden({ columna, direccion });
  };

  const iconoOrden = (columna) => {
    if (orden.columna === columna) {
      return orden.direccion === "asc" ? "▲" : "▼";
    }
    return "";
  };

  return (
    <div className="container">
      <h2 className="mb-4 d-flex align-items-center gap-2">
        <Receipt /> Facturación del día
      </h2>

      {/* Total del día */}
      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">Total facturado hoy</h6>
            <h2 className="text-success mb-0">${total}</h2>
          </div>
          <span className="badge bg-success fs-6">{ventas.length} ventas</span>
        </div>
      </div>

      {/* Tabla ventas con scroll */}
      <div className="card shadow-sm">
        <div
          className="card-body p-0"
          style={{ maxHeight: "500px", overflowY: "auto" }}
        >
          <table className="table mb-0">
            <thead className="sticky-top">
              <tr>
                <th style={{ width: "60px" }}></th>
                <th style={{ cursor: "pointer" }} onClick={() => ordenarPor("id")}>
                  ID {iconoOrden("id")}
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => ordenarPor("fecha")}>
                  Hora {iconoOrden("fecha")}
                </th>
                <th style={{ cursor: "pointer" }} onClick={() => ordenarPor("total")}>
                  Total {iconoOrden("total")}
                </th>
              </tr>
            </thead>

            <tbody>
              {ventas.map((v) => (
                <>
                  <tr key={v.id}>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => toggleDetalle(v.id)}
                      >
                        {ventaAbierta === v.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>

                    <td>
                      <span className="fw-semibold">#{v.id}</span>
                    </td>

                    <td>
                      {new Date(v.fecha).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="fw-semibold text-success">${v.total}</td>
                  </tr>

                  {ventaAbierta === v.id && detalles[v.id] && (
                    <tr>
                      <td colSpan="4">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Cantidad</th>
                              <th>Precio</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>

                          <tbody>
                            {detalles[v.id].map((d, i) => (
                              <tr key={i}>
                                <td>{d.nombre}</td>
                                <td>
                                  <span className="badge bg-secondary">{d.cantidad}</span>
                                </td>
                                <td>${d.precio}</td>
                                <td className="fw-semibold">${d.precio * d.cantidad}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Facturacion;