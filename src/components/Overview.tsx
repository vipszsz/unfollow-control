import { animate, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { compare, exportsOf } from '../data/analyze'
import type { Entry } from '../data/parse'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING_SLOW } from '../lib/motion'
import { pickZip } from '../lib/pickFile'
import { useUI } from '../lib/ui'
import { Button } from './Button'
import { ImportErrorNotice } from './ImportErrorNotice'
import { Panel, PanelLabel } from './Panel'
import { Icon } from './Icon'

const STALE_DAYS = 14
const DAY = 86_400_000

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { ...SPRING_SLOW, delay: 0.04 + i * 0.05 },
})

/** Summary shown after an import: the headline number plus the other lists at a glance. */
export function Overview() {
  const { t, lang } = useI18n()
  const { current: s, lists: l, importFile, importing, snapshots } = useData()
  const { setView } = useUI()
  const previous = useMemo(() => exportsOf(snapshots, s?.owner)[1], [snapshots, s])
  const diff = useMemo(() => (s && previous ? compare(s, previous) : null), [s, previous])
  if (!s || !l) return null

  const locale = lang === 'pt' ? 'pt-BR' : 'en'
  const num = new Intl.NumberFormat(locale)
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const shortDate = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })

  const exported = s.exportDate ? new Date(`${s.exportDate}T12:00:00`) : new Date(s.importedAt)
  const age = Math.floor((Date.now() - exported.getTime()) / DAY)
  const importedDays = Math.floor((Date.now() - s.importedAt) / DAY)
  const imported =
    importedDays < 1
      ? t.overview.importedToday
      : fmt(t.overview.importedAgo, { ago: new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-importedDays, 'day') })

  const pct = s.following.length ? l.notFollowingBack.length / s.following.length : 0

  const stats = [
    { key: 'following', label: t.overview.following, value: s.following.length },
    { key: 'followers', label: t.overview.followers, value: s.followers.length },
    { key: 'mutuals', label: t.overview.mutuals, value: l.mutuals.length },
    { key: 'fans', label: t.overview.fans, value: l.fans.length },
  ]

  return (
    <section className="overview">
      <motion.div className="overview-head" {...rise(0)}>
        <div>
          <h2 className="overview-owner">{s.owner ? `@${s.owner}` : t.appName}</h2>
          <p className="overview-meta">
            {fmt(t.overview.exportOf, { date: date.format(exported) })} · {imported}
          </p>
        </div>
        <Button variant="ghost" icon="upload" disabled={importing} onClick={() => pickZip(importFile)}>
          {importing ? t.importing : t.overview.importNew}
        </Button>
      </motion.div>

      <ImportErrorNotice />

      {diff && previous && (
        <motion.div className="teaser" {...rise(1)}>
          <span>
            {fmt(t.history.teaser, {
              date: date.format(previous.exportDate ? new Date(`${previous.exportDate}T12:00:00`) : new Date(previous.importedAt)),
              lost: num.format(diff.lost.length),
              gained: num.format(diff.gained.length),
            })}
          </span>
          <Button variant="ghost" icon="history" onClick={() => setView('history')}>
            {t.history.see}
          </Button>
        </motion.div>
      )}

      {age > STALE_DAYS && (
        <motion.div className="notice" role="status" {...rise(1)}>
          <span className="notice-dot" />
          {fmt(t.overview.stale, { days: age })}
        </motion.div>
      )}

      <div className="overview-grid">
        <motion.div {...rise(2)}>
          <PanelLabel live>not_following_back</PanelLabel>
          <Panel tint="blue" className="hero">
            <CountUp value={l.notFollowingBack.length} format={(n) => num.format(n)} className="hero-figure" />
            <p className="hero-caption">{t.overview.heroCaption}</p>
            <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label={t.overview.heroCaption}>
              <motion.span
                className="meter-fill"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct }}
                transition={{ ...SPRING_SLOW, delay: 0.2 }}
              />
            </div>
            <p className="meter-label">
              {fmt(t.overview.heroMeter, { pct: new Intl.NumberFormat(locale, { style: 'percent' }).format(pct) })}
            </p>
            <Button variant="primary" onClick={() => setView('notFollowingBack')}>
              {t.overview.seeList}
              <Icon name="arrowRight" size={13} />
            </Button>
          </Panel>
        </motion.div>

        <motion.div {...rise(3)}>
          <PanelLabel live>relationships</PanelLabel>
          <Panel tint="violet" className="stats">
            {stats.map((x) => (
              <div key={x.key} className="stat">
                <span className="stat-label">{x.label}</span>
                <span className="stat-value">{num.format(x.value)}</span>
              </div>
            ))}
          </Panel>
        </motion.div>

        <div className="overview-col">
          <motion.div {...rise(4)}>
            <PanelLabel live={l.pending.length > 0}>pending_requests</PanelLabel>
            <MiniList
              title={t.overview.pending}
              hint={t.overview.pendingHint}
              empty={t.overview.pendingEmpty}
              entries={l.pending}
              tint="amber"
              when={(e) => (e.t ? fmt(t.overview.since, { date: shortDate.format(e.t * 1000) }) : '')}
              more={(n) => fmt(t.overview.andMore, { n })}
              count={num.format(l.pending.length)}
            />
          </motion.div>
          <motion.div {...rise(5)}>
            <PanelLabel live={s.recentlyUnfollowed.length > 0}>recently_unfollowed</PanelLabel>
            <MiniList
              title={t.overview.unfollowed}
              empty={t.overview.unfollowedEmpty}
              entries={s.recentlyUnfollowed}
              tint="teal"
              when={(e) => (e.t ? date.format(e.t * 1000) : '')}
              more={(n) => fmt(t.overview.andMore, { n })}
              count={num.format(s.recentlyUnfollowed.length)}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MiniList({
  title,
  hint,
  empty,
  entries,
  tint,
  when,
  more,
  count,
}: {
  title: string
  hint?: string
  empty: string
  entries: Entry[]
  tint: 'amber' | 'teal'
  when(e: Entry): string
  more(n: number): string
  count: string
}) {
  const shown = entries.slice(0, 3)
  return (
    <Panel tint={tint} className="mini">
      <div className="mini-head">
        <h3>{title}</h3>
        <span className="mini-count">{count}</span>
      </div>
      {hint && <p className="mini-hint">{hint}</p>}
      {shown.length ? (
        <ul className="mini-list">
          {shown.map((e) => (
            <li key={e.u}>
              <span className="mini-user">
                @{e.u}
                {e.name && <span className="mini-name">{e.name}</span>}
              </span>
              <span className="mini-when">{when(e)}</span>
            </li>
          ))}
          {entries.length > shown.length && <li className="mini-more">{more(entries.length - shown.length)}</li>}
        </ul>
      ) : (
        <p className="mini-empty">{empty}</p>
      )}
    </Panel>
  )
}

/** Counts up to the value once, on an ease-out curve; static under reduced motion. */
function CountUp({ value, format, className }: { value: number; format(n: number): string; className?: string }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (reduce) {
      setShown(value)
      return
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [value, reduce])

  return <span className={className}>{format(shown)}</span>
}
