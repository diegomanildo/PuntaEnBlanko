/* eslint-disable no-undef */
import { app, BrowserWindow } from "electron";

const isDev = process.env.NODE_ENV !== "production";
const startUrl = isDev
  ? "http://localhost:5173"           // Vite dev server
  : `file://${__dirname}/dist/index.html`; // build para producción

let mainWindow;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
});