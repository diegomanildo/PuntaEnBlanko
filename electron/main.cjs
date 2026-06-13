const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      const win = wins[0];
      if (win.isMinimized()) win.restore();
      win.focus();
      win.moveTop();
    }
  });
  // ─────────────────────────────────────────────────────────────────────────────
  
  const backendPath = app.isPackaged
    ? path.join(process.resourcesPath, "backend")
    : path.join(__dirname, "../backend");

  process.env.DB_PATH = app.isPackaged
    ? app.getPath("userData")
    : path.join(__dirname, "../backend");

  async function createWindow() {
    const zoom = 1.3;
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
        zoomFactor: zoom,
        devTools: true,
      },
    });

    if (!app.isPackaged) {
      win.loadURL("http://localhost:5173");
    } else {
      win.loadFile(path.join(__dirname, "../dist/index.html"));
      Menu.setApplicationMenu(null);
    }

    win.maximize();

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
      win.webContents.setZoomFactor(zoom);
    });
  }

  app.whenReady().then(async () => {
    await createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}