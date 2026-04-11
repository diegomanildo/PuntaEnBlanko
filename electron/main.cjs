const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

// En producción, los archivos están en resources/backend
const backendPath = app.isPackaged
  ? path.join(process.resourcesPath, "backend")
  : path.join(__dirname, "../backend");

// DB apunta a userData en producción para que no se pierda con updates
process.env.DB_PATH = app.isPackaged
  ? app.getPath("userData")
  : path.join(__dirname, "../backend");

async function createWindow() {
  const zoom = 1.1;
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
    // win.webContents.openDevTools(); // -> Abre la consola
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

  // if (app.isPackaged) {
  //   dialog.showMessageBox({
  //     message: "DB PATH: " + app.getPath("userData")
  //   });
  // }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
