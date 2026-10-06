// Electron main process.
// Privacy guarantee: the app's own window can only load the app's own files; every
// network request from it is cancelled. The one exception is the Instagram panel, a
// <webview> in its own session that may only talk to Instagram/Meta domains. The app
// never reads or scripts that page: no preload, no injected code.
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

const IG_PARTITION = 'persist:instagram'
const IG_HOSTS = /(^|\.)(instagram\.com|cdninstagram\.com|fbcdn\.net|facebook\.com|facebook\.net|fbsbx\.com)$/

function isInstagram(url) {
  try {
    const u = new URL(url)
    return (u.protocol === 'https:' || u.protocol === 'wss:') && IG_HOSTS.test(u.hostname)
  } catch {
    return false
  }
}

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
    icon: path.join(__dirname, '..', DEV_URL ? 'public' : 'dist', 'icon-256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      webviewTag: true,
    },
  })

  // Lock down every <webview> before it attaches: Instagram session, no preload, no Node.
  win.webContents.on('will-attach-webview', (e, prefs, params) => {
    if (params.partition !== IG_PARTITION || !isInstagram(params.src || 'https://www.instagram.com/')) {
      e.preventDefault()
      return
    }
    delete prefs.preload
    prefs.nodeIntegration = false
    prefs.contextIsolation = true
    prefs.sandbox = true
    prefs.webSecurity = true
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

// Chromium writes cookies to disk only every ~30 s. Flush the Instagram session after each
// page load and before quitting, so a forced close right after logging in keeps the login.
const flushInstagram = () => session.fromPartition(IG_PARTITION).cookies.flushStore().catch(() => {})
let flushed = false
app.on('before-quit', (e) => {
  if (flushed) return
  e.preventDefault()
  flushInstagram().finally(() => {
    flushed = true
    app.quit()
  })
})

// Inside the Instagram panel: stay on Instagram, send anything else to the browser.
app.on('web-contents-created', (_e, contents) => {
  if (contents.getType() !== 'webview') return
  contents.on('did-finish-load', flushInstagram)
  contents.on('did-navigate-in-page', flushInstagram)
  contents.setWindowOpenHandler(({ url }) => {
    if (isInstagram(url)) contents.loadURL(url)
    else openExternal(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (e, url) => {
    if (!isInstagram(url)) {
      e.preventDefault()
      openExternal(url)
    }
  })
})

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeRequest((details, cb) => cb({ cancel: !isLocal(details.url) }))
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))

  const ig = session.fromPartition(IG_PARTITION)
  ig.webRequest.onBeforeRequest((details, cb) =>
    cb({ cancel: !(isInstagram(details.url) || /^(data|blob|devtools):/.test(details.url)) }),
  )
  ig.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))
  // Present as plain Chrome so Instagram serves its normal site.
  ig.setUserAgent(ig.getUserAgent().replace(/ (Electron|unfollow-control)\/\S+/g, ''))
  ipcMain.handle('ig:logout', () => ig.clearStorageData())

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
