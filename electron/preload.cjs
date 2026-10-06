// The only bridge between the page and Electron: window controls and opening allowed links.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('uc', {
  platform: process.platform,
  openExternal: (url) => ipcRenderer.send('open-external', url),
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
  close: () => ipcRenderer.send('win:close'),
  onMaximized: (cb) => {
    const handler = (_e, value) => cb(value)
    ipcRenderer.on('win:maximized', handler)
    return () => ipcRenderer.removeListener('win:maximized', handler)
  },
})
