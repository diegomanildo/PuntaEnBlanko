const { contextBridge, ipcRenderer } = require('electron')

// Expone una API segura al renderer (React)
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel, data) => ipcRenderer.send(channel, data),
  onMessage: (channel, callback) => ipcRenderer.on(channel, callback),
})