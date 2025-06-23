const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    getGlottologData: () => ipcRenderer.invoke('get-glottolog-data'),
    lookupGlottocode: (glottocode) => ipcRenderer.invoke('lookup-glottocode', glottocode),
    lookupLanguageName: (languageName) => ipcRenderer.invoke('lookup-language-name', languageName),
    saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    openGlottolog: () => ipcRenderer.send('open-glottolog'),
    toggleVarieties: (val) => ipcRenderer.send('toggle-varieties', val)
})