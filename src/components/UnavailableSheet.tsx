import { isDeleted } from '../data/marks'
import type { Entry } from '../data/parse'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { useUI } from '../lib/ui'
import { Button } from './Button'
import { Dialog } from './Dialog'

/** Why a profile won't open, and how to unfollow anyway when that's possible. */
export function UnavailableSheet({ entry, open, onClose }: { entry: Entry | null; open: boolean; onClose(): void }) {
  const { t, lang } = useI18n()
  const { current, marks, updateMark } = useData()
  const { openInstagram } = useUI()
  const e = entry
  const marked = e ? !!marks.get(e.u)?.unavailable : false
  const deleted = e ? isDeleted(e.u) : false
  const date = e?.t
    ? new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en', { dateStyle: 'long' }).format(e.t * 1000)
    : t.unavailable.unknownDate

  return (
    <Dialog open={open && !!e} onClose={onClose} title={t.unavailable.title} width={560}>
      {e && (
        <>
          <p className="dialog-body unavailable-who">
            <strong>{deleted ? t.list.deleted : `@${e.u}`}</strong> · {fmt(t.unavailable.since, { date })}
          </p>
          <ol className="causes">
            {t.unavailable.causes.map((c, i) => (
              <li key={c.title} className={deleted && i === 2 ? 'is-likely' : ''}>
                <strong>{c.title}</strong>
                <p>{fmt(c.body, { date })}</p>
              </li>
            ))}
          </ol>
          <div className="dialog-actions">
            {current?.owner && (
              <Button
                variant="plain"
                icon="external"
                onClick={() => openInstagram(`https://www.instagram.com/${current.owner}/following/`)}
              >
                {t.unavailable.openFollowing}
              </Button>
            )}
            {!deleted &&
              (marked ? (
                <Button variant="ghost" onClick={() => (updateMark(e.u, { unavailable: false }), onClose())}>
                  {t.unavailable.unmark}
                </Button>
              ) : (
                <Button variant="primary" onClick={() => (updateMark(e.u, { unavailable: true }), onClose())} data-autofocus>
                  {t.unavailable.mark}
                </Button>
              ))}
            {(deleted || marked) && (
              <Button variant="primary" onClick={onClose} data-autofocus>
                {t.unavailable.close}
              </Button>
            )}
          </div>
        </>
      )}
    </Dialog>
  )
}
