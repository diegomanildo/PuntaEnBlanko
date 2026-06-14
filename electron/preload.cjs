const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, callback) => ipcRenderer.on(channel, callback),
  seleccionarCarpeta: () => ipcRenderer.invoke('seleccionar-carpeta'),
  obtenerRutaDefaultBackups: () => ipcRenderer.invoke('obtener-ruta-default-backups'),
})