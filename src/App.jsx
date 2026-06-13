import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Productos from "./pages/Productos";
import NuevaVenta from "./pages/NuevaVenta";
import NuevoProducto from "./pages/productos/NuevoProducto";
import EditarProducto from "./pages/productos/EditarProducto";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import FacturacionDia from "./pages/FacturacionDia";
import FacturacionMes from "./pages/FacturacionMes";
import NuevoPresupuesto from "./pages/presupuesto/NuevoPresupuesto";
import Presupuestos from "./pages/Presupuestos";
import EditarPresupuesto from "./pages/presupuesto/EditarPresupuesto";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/clientes/NuevoCliente";
import EditarCliente from "./pages/clientes/EditarCliente";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <Navbar toggleTheme={toggleTheme} theme={theme} />

      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ventas/nueva" element={<NuevaVenta />} />

          <Route path="/presupuestos" element={<Presupuestos />} />
          <Route path="/presupuestos/nuevo" element={<NuevoPresupuesto />} />
          <Route
            path="/presupuestos/editar/:id"
            element={<EditarPresupuesto />}
          />

          <Route path="/facturacion/:fecha" element={<FacturacionDia />} />
          <Route path="/facturacion/mes" element={<FacturacionMes />} />
          <Route path="/facturacion/mes/:anio/:mes" element={<FacturacionMes />} />

          <Route path="/productos" element={<Productos />} />
          <Route path="/productos/nuevo" element={<NuevoProducto />} />
          <Route path="/productos/editar/:id" element={<EditarProducto />} />

          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/nuevo" element={<NuevoCliente />} />
          <Route path="/clientes/editar/:id" element={<EditarCliente />} />
        </Routes>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
