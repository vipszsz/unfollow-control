// Electron main process.
// Privacy guarantee: the window can only load the app's own files. Every network
// request is cancelled, and the only way out is opening an allowed Instagram link
// in the user's default browser.
const { app, BrowserWindow, ipcMain, session, shell } = require('electron')
const path = require('node:path')

const DEV_URL = process.env.VITE_DEV_SERVER_URL
const DEV_WS = DEV_URL && DEV_URL.replace(/^http/, 'ws')

// Portable .exe: keep data next to the executable instead of %APPDATA%.
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  app.setPath('userData', path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'Unfollow Control Data'))
}

const EXTERNAL_ALLOWED = [
  /^https:\/\/(www\.)?instagram\.com\//,
  /^https:\/\/accountscenter\.instagram\.com\//,
  /^https:\/\/github\.com\//,
]

function isLocal(url) {
  if (/^(file|devtools|data|blob):/.test(url)) return true
  return Boolean(DEV_URL && (url.startsWith(DEV_URL) || url.startsWith(DEV_WS)))
}

function openExternal(url) {
  if (typeof url === 'string' && EXTERNAL_ALLOWED.some((re) => re.test(url))) shell.openExternal(url)
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    backgroundColor: '#06070a',
    show: false,
    title: 'Unfollow Control',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  })

  win.once('ready-to-show', () => win.show())
  win.on('maximize', () => win.webContents.send('win:maximized', true))
  win.on('unmaximize', () => win.webContents.send('win:maximized', false))

  // Never navigate away from the app or open new windows inside it.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    if (!isLocal(url)) {
      e.preventDefault()
      openExternal(url)
    }
  })

  if (DEV_URL) win.loadURL(DEV_URL)
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((details, cb) => cb({ cancel: !isLocal(details.url) }))
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))

  ipcMain.on('open-external', (_e, url) => openExternal(url))
  ipcMain.on('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.on('win:toggle-maximize', (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (w) w.isMaximized() ? w.unmaximize() : w.maximize()
  })
  ipcMain.on('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())

  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
