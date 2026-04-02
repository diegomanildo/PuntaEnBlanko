const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function startBackend() {
  // Usar el ejecutable de Node que trae Electron
  const nodePath = process.execPath;
  
  const serverPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js')
    : path.join(__dirname, 'backend', 'server.js');

  backendProcess = spawn(nodePath, [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001', ELECTRON_RUN_AS_NODE: '1' }
  });

  backendProcess.on('error', (err) => {
    console.error('Error al iniciar el backend:', err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    icon: path.join(__dirname, 'public', 'minilogo.ico'),
    webPreferences: {
      contextIsolation: true,
    }
  });

  win.maximize();
  win.setMenu(null);

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }

  win.once('ready-to-show', () => {
    win.show();
    win.webContents.openDevTools(); // sacá esto cuando funcione
  });
}

app.whenReady().then(() => {
  startBackend();
  setTimeout(createWindow, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});