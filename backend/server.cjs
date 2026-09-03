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
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  },
};
