/* eslint-disable no-undef */
import { spawn } from "child_process";
import waitOn from "wait-on";

const frontend = spawn("npm", ["run", "frontend"], { stdio: "inherit", shell: true });

const backend = spawn("node", ["backend/server.js"], { stdio: "inherit", shell: true });

waitOn({ resources: ["http://localhost:5173"] }, (err) => {
  if (err) {
    console.error("Error esperando a Vite:", err);
    process.exit(1);
  }

  console.log("Vite listo, abriendo Electron...");

  const electron = spawn("electron", [".", "--dev"], { stdio: "inherit", shell: true });

  electron.on("close", () => {
    backend.kill();
    frontend.kill();
    process.exit();
  });
});