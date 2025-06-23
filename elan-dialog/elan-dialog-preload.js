const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    sendTierData: (data) => ipcRenderer.send('return-tier-data', data),
    onTierDataReceived: (callback) => ipcRenderer.on('give-tier-data', (event, data) => callback(data))
});