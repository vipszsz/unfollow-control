import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'

/** Frameless window chrome: drag region plus custom window controls. */
export function TitleBar() {
  const { t } = useI18n()
  const [maximized, setMaximized] = useState(false)
  const uc = window.uc

  useEffect(() => uc?.onMaximized(setMaximized), [uc])

  return (
    <div className="titlebar" onDoubleClick={() => uc?.toggleMaximize()}>
      {uc && (
        <div className="traffic" onDoubleClick={(e) => e.stopPropagation()}>
          <button type="button" className="traffic-btn is-close" aria-label={t.win.close} onClick={uc.close}>
            <svg viewBox="0 0 10 10"><path d="M3 3l4 4M7 3l-4 4" /></svg>
          </button>
          <button type="button" className="traffic-btn is-min" aria-label={t.win.minimize} onClick={uc.minimize}>
            <svg viewBox="0 0 10 10"><path d="M2.5 5h5" /></svg>
          </button>
          <button
            type="button"
            className="traffic-btn is-max"
            aria-label={maximized ? t.win.restore : t.win.maximize}
            onClick={uc.toggleMaximize}
          >
            <svg viewBox="0 0 10 10"><path d={maximized ? 'M3.5 6.5h-1v-4h4v1M3.5 3.5h4v4h-4z' : 'M3 3h4v4H3z'} /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
