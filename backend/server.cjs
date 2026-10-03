const express = require("express");
const cors = require("cors");

const productosRoutes = require("./routes/productos.cjs");
const ventasRoutes = require("./routes/ventas.cjs");
const presupuestoRoutes = require("./routes/presupuestos.cjs");
const clientesRouter = require("./routes/clientes.cjs");
const backupsRouter = require("./routes/backups.cjs");

const { PORT } = require("./config.cjs");
const { initDb } = require("./db.cjs");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/productos", productosRoutes);
app.use("/ventas", ventasRoutes);
app.use("/presupuestos", presupuestoRoutes);
app.use("/clientes", clientesRouter);
app.use("/backups", backupsRouter);

// Ruta no encontrada
app.use((req, res) => {
  res
    .status(404)
    .json({ error: "Ruta no encontrada", message: "Ruta no encontrada" });
});

// Manejador de errores central. Forma de respuesta única para todo el backend:
// { error, message } con el mismo texto (el front lee una u otra clave).
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const msg = err.message || "Error interno del servidor";
  res.status(status).json({ error: msg, message: msg });
});

module.exports = {
  startServer: async () => {
    await initDb();
    // Solo localhost: la API no tiene autenticación y no debe quedar expuesta a la red.
    // Se espera a que el puerto esté escuchando (o falle, ej. puerto ocupado) antes de resolver.
    await new Promise((resolve, reject) => {
      const server = app.listen(PORT, "127.0.0.1", () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
        resolve();
      });
      server.once("error", reject);
    });
  },
};
