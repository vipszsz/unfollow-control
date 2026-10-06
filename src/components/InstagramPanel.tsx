import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { openExternal } from '../lib/prefs'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { Menu } from './Menu'

// Electron's <webview> element; only the methods this panel uses.
interface WebviewEl extends HTMLElement {
  loadURL(url: string): Promise<void>
  getURL(): string
  goBack(): void
  goForward(): void
  canGoBack(): boolean
  canGoForward(): boolean
  reload(): void
}

/**
 * Instagram's official site inside the app, in its own locked-down session (see electron/main.cjs).
 * The user logs in and clicks "Unfollow" themselves; the app never reads or scripts this page.
 */
export function InstagramPanel({ url, onClose }: { url: string; onClose(): void }) {
  const { t } = useI18n()
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<WebviewEl | null>(null)
  const ready = useRef(false)
  const [loading, setLoading] = useState(true)
  const [nav, setNav] = useState({ back: false, forward: false })
  const [current, setCurrent] = useState(url)
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Create the webview once; keep it alive so the session and scroll survive.
  useEffect(() => {
    const el = document.createElement('webview') as WebviewEl
    el.setAttribute('partition', 'persist:instagram')
    el.setAttribute('src', url)
    el.className = 'ig-webview'
    const sync = () => {
      setNav({ back: el.canGoBack(), forward: el.canGoForward() })
      setCurrent(el.getURL())
    }
    el.addEventListener('dom-ready', () => {
      ready.current = true
      sync()
    })
    el.addEventListener('did-start-loading', () => setLoading(true))
    el.addEventListener('did-stop-loading', () => {
      setLoading(false)
      sync()
    })
    el.addEventListener('did-navigate', sync)
    el.addEventListener('did-navigate-in-page', sync)
    host.current?.appendChild(el)
    view.current = el
    return () => {
      el.remove()
      view.current = null
      ready.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Later URLs load into the same webview.
  useEffect(() => {
    const el = view.current
    if (!el || !ready.current || el.getURL() === url) return
    el.loadURL(url).catch(() => {})
  }, [url])

  const path = current.replace(/^https:\/\/(www\.)?instagram\.com/, '') || '/'

  return (
    <aside className="ig-panel" aria-label="Instagram">
      <div className="ig-bar">
        <Button variant="icon" icon="chevronLeft" aria-label={t.panel.back} disabled={!nav.back} onClick={() => view.current?.goBack()} />
        <Button variant="icon" icon="chevronRight" aria-label={t.panel.forward} disabled={!nav.forward} onClick={() => view.current?.goForward()} />
        <Button variant="icon" icon="reload" aria-label={t.panel.reload} onClick={() => view.current?.reload()} />
        <span className="ig-address">
          <Icon name="lock" size={11} />
          instagram.com<span className="ig-path">{path}</span>
        </span>
        <Menu
          entries={[
            { icon: 'external', label: t.panel.browser, onSelect: () => openExternal(current) },
            { kind: 'divider' },
            { icon: 'logout', label: t.panel.logout, danger: true, onSelect: () => setConfirmLogout(true) },
          ]}
          trigger={(p) => <Button {...p} variant="icon" icon="more" aria-label={t.actions.more} />}
        />
        <Button variant="icon" icon="close" aria-label={t.panel.close} onClick={onClose} />
      </div>
      <div className={`ig-progress ${loading ? 'is-loading' : ''}`} />
      <div ref={host} className="ig-host" />
      <p className="ig-note">{t.panel.note}</p>

      <Dialog open={confirmLogout} onClose={() => setConfirmLogout(false)} title={t.panel.logout} width={420}>
        <p className="dialog-body">{t.panel.logoutBody}</p>
        <div className="dialog-actions">
          <Button variant="ghost" onClick={() => setConfirmLogout(false)} data-autofocus>
            {t.wipe.cancel}
          </Button>
          <Button
            variant="danger"
            icon="logout"
            onClick={async () => {
              await window.uc?.instagramLogout()
              setConfirmLogout(false)
              view.current?.loadURL('https://www.instagram.com/').catch(() => {})
            }}
          >
            {t.panel.logout}
          </Button>
        </div>
      </Dialog>
    </aside>
  )
}
