const { app, BrowserWindow } = require("electron");
const path = require("path");

// En producción, los archivos están en resources/backend
const backendPath = app.isPackaged
  ? path.join(process.resourcesPath, "backend")
  : path.join(__dirname, "../backend");

process.env.DB_PATH = backendPath; // tu db.cjs ya usa esta variable

async function createWindow() {
  const { startServer } = require(path.join(backendPath, "server.cjs"));
  await startServer();

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Doble seguro: ready-to-show + did-finish-load
  win.once("ready-to-show", () => {
    win.show();
    win.focus();
    win.moveTop();
  });

  win.webContents.once("did-finish-load", () => {
    if (!win.isVisible()) {
      win.show();
      win.focus();
      win.moveTop();
      win.setAlwaysOnTop(true);
      setTimeout(() => win.setAlwaysOnTop(false), 1000);
    }
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
