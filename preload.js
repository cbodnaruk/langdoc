const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  saveDictionary: (dict) => ipcRenderer.send('save-dictionary', dict),
  getTextList: () => ipcRenderer.invoke('load-text-list'),
  showFile: (callback) => ipcRenderer.on('show-file',(e, lines) => callback(lines)),
  setVisibility: (callback) => ipcRenderer.on('set-visibility',(e,val,label)=>callback(val,label)),
  loadMedia:(callback) => ipcRenderer.on('load-media',(e,audio,offset)=>callback(audio,offset)),
  loadTextFromFile: (file) => ipcRenderer.send('load-text-from-file', file),
  editText: (edit) => ipcRenderer.send('edit-text',edit),
  inspect: (coords) => ipcRenderer.send('inspect',coords),
  saveSettings: (settings) => ipcRenderer.send('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  changeClipboard: (callback) => ipcRenderer.on('change-clipboard',(e,format) =>callback(format)),
  progressUpdate: (callback) => ipcRenderer.on('progress-update',(e,text)=>callback(text))
})