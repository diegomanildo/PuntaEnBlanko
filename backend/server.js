import express from "express";
import cors from "cors";

import productosRoutes from "./routes/productos.js";
import ventasRoutes from "./routes/ventas.js";
import { PORT } from "./config.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/productos", productosRoutes);
app.use("/ventas", ventasRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
