const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;

app.on("ready", () => {
  const isDev = !app.isPackaged;
  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "dist", "index.html")}`;

  const nodeBin = process.platform === "win32" ? "node.exe" : "node";

  const backend = spawn(
    nodeBin,
    [path.join(process.resourcesPath, "backend", "server.js")],
    {
      cwd: path.join(process.resourcesPath, "backend"),
      env: { ...process.env },
      shell: true,
      DB_PATH: app.getPath("userData"), 
    },
  );

  backend.stdout.on("data", (data) => console.log("Backend:", data.toString()));
  backend.stderr.on("data", (data) =>
    console.error("Backend error:", data.toString()),
  );
  backend.on("error", (err) => console.error("Spawn error:", err));
  backend.on("close", (code) =>
    console.error("Backend cerro con codigo:", code),
  );

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      zoomFactor: 1.1,
    },
  });

  setTimeout(() => {
    mainWindow.loadURL(startUrl);
  }, 2000);
});
