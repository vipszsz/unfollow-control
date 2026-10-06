import { useMemo, useState } from 'react'
import { bulkCandidates, type ExcludeGroup } from '../data/marks'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { useUI } from '../lib/ui'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Switch } from './Switch'

const GROUPS: ExcludeGroup[] = ['closeFriends', 'kept', 'recent', 'unavailable']

/**
 * "Send everyone to the queue": opt-out instead of opt-in (Google Photos cleanup style).
 * Shows who each rule keeps out before anything is queued.
 */
export function BulkQueueDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const { t, lang } = useI18n()
  const { current, lists, marks, updateMany } = useData()
  const { setView } = useUI()
  const [exclude, setExclude] = useState<Record<ExcludeGroup, boolean>>({
    closeFriends: true,
    kept: true,
    recent: true,
    unavailable: true,
  })
  const num = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en')

  const { pool, groups } = useMemo(
    () => (current && lists ? bulkCandidates(current, lists.notFollowingBack, marks) : { pool: [], groups: null }),
    [current, lists, marks],
  )
  const chosen = useMemo(() => {
    if (!groups) return []
    return pool.filter((e) => !GROUPS.some((g) => exclude[g] && groups[g].has(e.u)))
  }, [pool, groups, exclude])

  return (
    <Dialog open={open} onClose={onClose} title={t.bulk.title} width={560}>
      <p className="dialog-body">{t.bulk.body}</p>
      <div className="bulk-label">{t.bulk.keepOut}</div>
      <ul className="bulk-groups">
        {GROUPS.map((g) => (
          <li key={g} className={groups?.[g].size ? '' : 'is-empty'}>
            <div className="bulk-text">
              <strong>
                {t.bulk.groups[g].title} <span className="bulk-count">{num.format(groups?.[g].size ?? 0)}</span>
              </strong>
              <span>{t.bulk.groups[g].body}</span>
            </div>
            <Switch
              checked={exclude[g]}
              onChange={(v) => setExclude((x) => ({ ...x, [g]: v }))}
              label={t.bulk.groups[g].title}
              hideLabel
            />
          </li>
        ))}
      </ul>
      <p className="bulk-always">{t.bulk.always}</p>
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose}>
          {t.bulk.cancel}
        </Button>
        <Button
          variant="primary"
          icon="queue"
          disabled={!chosen.length}
          data-autofocus
          onClick={() => {
            updateMany(
              chosen.map((e) => e.u),
              { tag: 'queue' },
            )
            onClose()
            setView('queue')
          }}
        >
          {chosen.length ? fmt(t.bulk.confirm, { n: num.format(chosen.length) }) : t.bulk.none}
        </Button>
      </div>
    </Dialog>
  )
}
