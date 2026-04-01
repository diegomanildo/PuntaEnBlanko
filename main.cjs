const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;

function startBackend() {
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  backendProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3001' }
  });

  backendProcess.on('error', (err) => {
    console.error('Error al iniciar el backend:', err);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,          // no mostrar hasta que esté lista
    icon: path.join(__dirname, 'public', 'minilogo.ico'),
    webPreferences: {
      contextIsolation: true,
    }
  });

  win.maximize();         // maximizar

  win.setMenu(null);

  // En producción carga el build, en dev carga Vite
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    win.loadURL('http://localhost:5173');
  }

  win.once('ready-to-show', () => {
    win.show();           // mostrar recién cuando cargó todo
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