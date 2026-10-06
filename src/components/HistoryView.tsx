import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { analyze, compare, exportsOf } from '../data/analyze'
import type { Entry, Snapshot } from '../data/parse'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { pickZip } from '../lib/pickFile'
import { useUI } from '../lib/ui'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Icon } from './Icon'
import { Menu } from './Menu'
import { Panel, PanelLabel, type Tint } from './Panel'

const PREVIEW = 6

/** What changed between two exports of the same account. */
export function HistoryView() {
  const { t, lang } = useI18n()
  const { current, snapshots, importFile, deleteSnapshot } = useData()
  const { openGuide } = useUI()
  const exports = useMemo(() => exportsOf(snapshots, current?.owner), [snapshots, current])
  const [olderId, setOlderId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Snapshot | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const locale = lang === 'pt' ? 'pt-BR' : 'en'
  const num = new Intl.NumberFormat(locale)
  const signed = new Intl.NumberFormat(locale, { signDisplay: 'exceptZero' })
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const dateOf = (s: Snapshot) => date.format(s.exportDate ? new Date(`${s.exportDate}T12:00:00`) : new Date(s.importedAt))

  const newer = exports[0]
  const older = exports.find((s) => s.id === olderId && s !== newer) ?? exports[1]

  const head = (
    <div className="listview-head">
      <div>
        <h2 className="listview-title">{t.history.title}</h2>
        <p className="listview-about">{t.history.about}</p>
      </div>
      {older && exports.length > 2 && (
        <Menu
          entries={exports.slice(1).map((s) => ({ label: dateOf(s), checked: s === older, onSelect: () => setOlderId(s.id) }))}
          trigger={(p) => (
            <Button {...p} variant="ghost" icon="history">
              {fmt(t.history.comparing, { date: dateOf(older) })}
              <Icon name="chevronDown" size={13} />
            </Button>
          )}
        />
      )}
      {older && exports.length === 2 && <span className="chip chip-today">{fmt(t.history.comparing, { date: dateOf(older) })}</span>}
    </div>
  )

  if (!newer) return null

  return (
    <section className="history">
      {head}

      {older ? (
        <Comparison newer={newer} older={older} vs={fmt(t.history.vs, { date: dateOf(older) })} num={num} signed={signed} />
      ) : (
        <Panel tint="sky" className="deck-done history-empty">
          <span className="badge badge-blue">
            <Icon name="history" size={16} />
          </span>
          <h3>{t.history.onlyOneTitle}</h3>
          <p>{t.history.onlyOneBody}</p>
          <div className="dialog-actions">
            <Button variant="ghost" icon="help" onClick={openGuide}>
              {t.menu.howTo}
            </Button>
            <Button variant="primary" icon="upload" onClick={() => pickZip(importFile)}>
              {t.overview.importNew}
            </Button>
          </div>
        </Panel>
      )}

      <PanelLabel live>saved_exports</PanelLabel>
      <Panel className="exports">
        <h3 className="exports-title">{t.history.exports}</h3>
        <ul>
          {exports.map((s, i) => (
            <li key={s.id}>
              <span className="exports-date">
                {dateOf(s)}
                {i === 0 && <span className="chip chip-done">{t.history.latest}</span>}
              </span>
              <span className="exports-meta">
                {fmt(t.history.exportRow, { followers: num.format(s.followers.length), following: num.format(s.following.length) })}
              </span>
              <Button
                variant="icon"
                icon="trash"
                aria-label={t.history.deleteExport}
                onClick={() => {
                  setDeleting(s)
                  setDeleteOpen(true)
                }}
              />
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={deleting ? fmt(t.history.deleteTitle, { date: dateOf(deleting) }) : ''}
        width={440}
      >
        <p className="dialog-body">{t.history.deleteBody}</p>
        <div className="dialog-actions">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)} data-autofocus>
            {t.wipe.cancel}
          </Button>
          <Button
            variant="danger"
            icon="trash"
            onClick={async () => {
              if (deleting) await deleteSnapshot(deleting.id)
              setDeleteOpen(false)
            }}
          >
            {t.history.deleteExport}
          </Button>
        </div>
      </Dialog>
    </section>
  )
}

function Comparison({
  newer,
  older,
  vs,
  num,
  signed,
}: {
  newer: Snapshot
  older: Snapshot
  vs: string
  num: Intl.NumberFormat
  signed: Intl.NumberFormat
}) {
  const { t } = useI18n()
  const diff = useMemo(() => compare(newer, older), [newer, older])
  const [a, b] = useMemo(() => [analyze(newer), analyze(older)], [newer, older])

  // Delta color = direction × whether "up" is good for that number.
  const tiles: { label: string; now: number; before: number; upIsGood: boolean | null }[] = [
    { label: t.overview.followers, now: newer.followers.length, before: older.followers.length, upIsGood: true },
    { label: t.overview.following, now: newer.following.length, before: older.following.length, upIsGood: null },
    { label: t.nav.notFollowingBack, now: a.notFollowingBack.length, before: b.notFollowingBack.length, upIsGood: false },
    { label: t.overview.mutuals, now: a.mutuals.length, before: b.mutuals.length, upIsGood: true },
  ]

  const groups: { key: string; title: string; list: Entry[]; tint: Tint }[] = [
    { key: 'lost', title: t.history.lost, list: diff.lost, tint: 'amber' },
    { key: 'gained', title: t.history.gained, list: diff.gained, tint: 'green' },
    { key: 'youUnfollowed', title: t.history.youUnfollowed, list: diff.youUnfollowed, tint: 'violet' },
    { key: 'youFollowed', title: t.history.youFollowed, list: diff.youFollowed, tint: 'teal' },
  ]

  return (
    <>
      <PanelLabel live>changes</PanelLabel>
      <Panel tint="blue" className="stats stats-4">
        {tiles.map((x) => {
          const d = x.now - x.before
          const tone = d === 0 || x.upIsGood === null ? 'flat' : d > 0 === x.upIsGood ? 'good' : 'bad'
          return (
            <div key={x.label} className="stat">
              <span className="stat-label">{x.label}</span>
              <span className="stat-value">{num.format(x.now)}</span>
              <span className={`delta delta-${tone}`}>
                {d === 0 ? '±0' : signed.format(d)} <span className="delta-vs">{vs}</span>
              </span>
            </div>
          )
        })}
      </Panel>

      <div className="diff-grid">
        {groups.map((g) => (
          <div key={g.key}>
            <PanelLabel live={g.list.length > 0}>{g.key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}</PanelLabel>
            <DiffList title={g.title} list={g.list} tint={g.tint} count={num.format(g.list.length)} />
          </div>
        ))}
      </div>
    </>
  )
}

function DiffList({ title, list, tint, count }: { title: string; list: Entry[]; tint: Tint; count: string }) {
  const { t } = useI18n()
  const { openProfile } = useUI()
  const [all, setAll] = useState(false)
  const shown = all ? list : list.slice(0, PREVIEW)

  return (
    <Panel tint={tint} className="mini">
      <div className="mini-head">
        <h3>{title}</h3>
        <span className="mini-count">{count}</span>
      </div>
      {list.length ? (
        <ul className="mini-list diff-list">
          <AnimatePresence initial={false}>
            {shown.map((e) => (
              <motion.li key={e.u} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING}>
                <span className="diff-user">
                  <Avatar username={e.u} size={24} />@{e.u}
                </span>
                <Button variant="icon" icon="external" aria-label={t.list.open} onClick={() => openProfile(e.u)} />
              </motion.li>
            ))}
          </AnimatePresence>
          {list.length > PREVIEW && (
            <li className="mini-more">
              <button type="button" className="link" onClick={() => setAll((v) => !v)}>
                {all ? t.history.showLess : fmt(t.history.showAll, { n: list.length })}
              </button>
            </li>
          )}
        </ul>
      ) : (
        <p className="mini-empty">{t.history.nobody}</p>
      )}
    </Panel>
  )
}
