// dev-electron.js
import { spawn } from "child_process";
import waitOn from "wait-on";

// ── Levantamos frontend (Vite)
const frontend = spawn("npm", ["run", "frontend"], { stdio: "inherit", shell: true });

// ── Levantamos backend
const backend = spawn("node", ["backend/server.js"], { stdio: "inherit", shell: true });

// ── Esperamos a que Vite esté listo
waitOn({ resources: ["http://localhost:5173"] }, (err) => {
  if (err) {
    console.error("Error esperando a Vite:", err);
    process.exit(1);
  }

  console.log("Vite listo, abriendo Electron...");

  // ── Abrimos Electron
  const electron = spawn("electron", [".", "--dev"], { stdio: "inherit", shell: true });

  electron.on("close", () => {
    backend.kill();
    frontend.kill();
    process.exit();
  });
});