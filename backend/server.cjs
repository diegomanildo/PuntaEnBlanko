const express = require("express");
const cors = require("cors");

const productosRoutes = require("./routes/productos.cjs");
const ventasRoutes = require("./routes/ventas.cjs");
const presupuestoRoutes = require("./routes/presupuestos.cjs");
const clientesRouter = require("./routes/clientes.cjs");
const { PORT } = require("./config.cjs");
const { initDb } = require("./db.cjs");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/productos", productosRoutes);
app.use("/ventas", ventasRoutes);
app.use("/presupuestos", presupuestoRoutes);
app.use("/clientes", clientesRouter);

module.exports = {
  startServer: async () => {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  },
};
