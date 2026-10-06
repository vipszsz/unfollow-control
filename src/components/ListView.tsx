import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { isDeleted, isHandled, isUnavailable, TAGS, type Tag } from '../data/marks'
import type { Entry } from '../data/parse'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { readPref, writePref } from '../lib/prefs'
import { useUI, type ListKey } from '../lib/ui'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Icon } from './Icon'
import { Menu } from './Menu'
import { Panel, PanelLabel } from './Panel'
import { Switch } from './Switch'
import { StatusChip, TAG_COLOR, TagMenu } from './Tags'
import { Tooltip } from './Tooltip'

const PAGE = 10
const SORTS = ['oldest', 'newest', 'az', 'za'] as const
type Sort = (typeof SORTS)[number]
type Filter = 'all' | 'none' | Tag | 'unavailable' | 'unfollowed'

const LABELS: Record<ListKey, string> = {
  notFollowingBack: 'not_following_back',
  mutuals: 'mutuals',
  fans: 'fans',
  pending: 'pending_requests',
}


function sortRows(rows: Entry[], sort: Sort) {
  const out = [...rows]
  if (sort === 'az') out.sort((a, b) => a.u.localeCompare(b.u))
  else if (sort === 'za') out.sort((a, b) => b.u.localeCompare(a.u))
  // Accounts without a date go last either way.
  else out.sort((a, b) => (a.t ? (b.t ? (sort === 'oldest' ? a.t - b.t : b.t - a.t) : -1) : b.t ? 1 : 0))
  return out
}

/** One list, 10 accounts per page, driven by mouse or keyboard (J/K, O, X, ←/→). */
export function ListView({ list }: { list: ListKey }) {
  const { t, lang } = useI18n()
  const { lists, marks, toggleReviewed } = useData()
  const { query, setQuery, openProfile, explainUnavailable } = useUI()
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSortState] = useState<Sort>(() => readPref('sort', SORTS, 'oldest'))
  const [hideReviewed, setHideState] = useState(() => readPref('hideReviewed', ['1', '0'], '0') === '1')
  const [[page, dir], setPage] = useState<[number, number]>([0, 1])
  const [sel, setSel] = useState(0)

  const locale = lang === 'pt' ? 'pt-BR' : 'en'
  const month = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }), [locale])
  const num = useMemo(() => new Intl.NumberFormat(locale), [locale])

  const all = lists?.[list] ?? []
  const q = query.trim().replace(/^@/, '').toLowerCase()

  const rows = useMemo(() => {
    const filtered = all.filter(
      (e) => {
        const m = marks.get(e.u)
        if (q && !e.u.includes(q) && !e.name?.toLowerCase().includes(q)) return false
        if (hideReviewed && (isHandled(m) || isDeleted(e.u))) return false
        if (filter === 'none') return !m?.tag
        if (filter === 'unavailable') return isUnavailable(e.u, m)
        if (filter === 'unfollowed') return !!m?.unfollowedAt
        return filter === 'all' || m?.tag === filter
      },
    )
    return sortRows(filtered, sort)
  }, [all, q, sort, hideReviewed, marks, filter])

  const reviewedCount = useMemo(() => all.filter((e) => isHandled(marks.get(e.u)) || isDeleted(e.u)).length, [all, marks])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = Math.min(page, pages - 1)
  const shown = rows.slice(current * PAGE, current * PAGE + PAGE)
  const selected = Math.min(sel, Math.max(shown.length - 1, 0))

  // A different list, search or sort starts again from the top.
  useEffect(() => {
    setPage([0, 1])
    setSel(0)
  }, [list, q, sort, hideReviewed, filter])

  const goPage = (to: number, selectAt = 0) => {
    if (to < 0 || to >= pages || to === current) return
    setPage([to, to > current ? 1 : -1])
    setSel(selectAt)
  }

  const setSort = (s: Sort) => {
    writePref('sort', s)
    setSortState(s)
  }
  const setHide = (v: boolean) => {
    writePref('hideReviewed', v ? '1' : '0')
    setHideState(v)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.dialog, .menu')) return
      if ((e.target as HTMLElement).closest('input, textarea')) return
      const row = shown[selected]
      // Holding J/K scrolls through rows; holding O or X must not act more than once.
      if (e.repeat && ['o', 'Enter', 'x'].includes(e.key)) return
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault()
          if (selected < shown.length - 1) setSel(selected + 1)
          else goPage(current + 1, 0)
          break
        case 'k':
        case 'ArrowUp':
          e.preventDefault()
          if (selected > 0) setSel(selected - 1)
          else goPage(current - 1, PAGE - 1)
          break
        case 'ArrowRight':
          goPage(current + 1)
          break
        case 'ArrowLeft':
          goPage(current - 1)
          break
        case 'o':
        case 'Enter':
          if (row) (isUnavailable(row.u, marks.get(row.u)) ? explainUnavailable(row) : openProfile(row.u))
          break
        case 'x':
          if (row) toggleReviewed(row.u)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const since = (e: Entry) => (e.t ? fmt(t.list.since[list], { date: month.format(e.t * 1000) }) : '')
  const empty = q ? fmt(t.list.emptySearch, { q: query.trim() }) : hideReviewed && all.length ? t.list.emptyReviewed : t.list.empty

  return (
    <section className="listview">
      <div className="listview-head">
        <div>
          <h2 className="listview-title">
            {t.nav[list]} <span className="listview-count">{num.format(all.length)}</span>
          </h2>
          <p className="listview-about">{t.list.about[list]}</p>
        </div>
        <div className="listview-progress">
          <span>{fmt(t.list.reviewedCount, { n: num.format(reviewedCount), total: num.format(all.length) })}</span>
          <span className="meter meter-sm">
            <motion.span
              className="meter-fill"
              initial={false}
              animate={{ scaleX: all.length ? reviewedCount / all.length : 0 }}
              transition={SPRING}
            />
          </span>
        </div>
      </div>

      <PanelLabel live>{LABELS[list]}</PanelLabel>
      <Panel tint="blue" className="listpanel">
        <div className="list-toolbar">
          <Menu
            entries={SORTS.map((s) => ({ label: t.list.sorts[s], checked: s === sort, onSelect: () => setSort(s) }))}
            trigger={(p) => (
              <Button {...p} variant="ghost" icon="sort">
                {t.list.sorts[sort]}
                <Icon name="chevronDown" size={13} />
              </Button>
            )}
          />
          <Menu
            entries={[
              { label: t.tags.all, checked: filter === 'all', onSelect: () => setFilter('all') },
              { label: t.tags.none, checked: filter === 'none', onSelect: () => setFilter('none') },
              { kind: 'divider' as const },
              ...TAGS.map((tag) => ({ dot: TAG_COLOR[tag], label: t.tags[tag], checked: filter === tag, onSelect: () => setFilter(tag) })),
              { kind: 'divider' as const },
              { icon: 'alert' as const, label: t.tags.unavailable, checked: filter === 'unavailable', onSelect: () => setFilter('unavailable') },
              { icon: 'check' as const, label: t.tags.unfollowed, checked: filter === 'unfollowed', onSelect: () => setFilter('unfollowed') },
            ]}
            trigger={(p) => (
              <Button {...p} variant={filter === 'all' ? 'ghost' : 'primary'} icon="tag">
                {filter === 'all' ? t.tags.filter : filter === 'none' ? t.tags.none : t.tags[filter]}
                <Icon name="chevronDown" size={13} />
              </Button>
            )}
          />
          <span className="toolbar-spacer" />
          <Switch checked={hideReviewed} onChange={setHide} label={t.list.hideReviewed} />
        </div>

        {shown.length ? (
          <div className="list-stage">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.ul
                key={`${list}-${current}`}
                className="rows"
                custom={dir}
                variants={{
                  enter: (d: number) => ({ x: d * 28, opacity: 0, filter: 'blur(4px)' }),
                  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
                  exit: (d: number) => ({ x: d * -28, opacity: 0, filter: 'blur(4px)' }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={SPRING}
              >
                <AnimatePresence initial={false}>
                  {shown.map((e, i) => {
                    const m = marks.get(e.u)
                    const reviewed = !!m?.reviewed
                    const gone = isDeleted(e.u)
                    const broken = isUnavailable(e.u, m)
                    return (
                      <motion.li
                        key={e.u}
                        layout="position"
                        className={`row ${isHandled(m) || gone ? 'is-reviewed' : ''}`}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                        transition={SPRING}
                        onPointerDown={() => setSel(i)}
                      >
                        {i === selected && <motion.span layoutId="row-sel" className="row-sel" transition={SPRING} />}
                        <Avatar username={e.u} muted={gone} />
                        <div className="row-main">
                          <span className="row-user">{gone ? t.list.deleted : `@${e.u}`}</span>
                          <span className="row-sub">
                            {gone ? t.list.deletedSub : e.name && <span>{e.name}</span>}
                            {(gone || e.name) && since(e) && <span aria-hidden="true"> · </span>}
                            {since(e)}
                          </span>
                        </div>
                        <StatusChip username={e.u} mark={m} />
                        <TagMenu entry={e} />
                        <Tooltip label={reviewed ? t.list.unreview : t.list.review}>
                          <button
                            type="button"
                            className="row-check"
                            aria-pressed={reviewed}
                            aria-label={reviewed ? t.list.unreview : t.list.review}
                            onClick={() => toggleReviewed(e.u)}
                          >
                            <Icon name="check" size={14} />
                          </button>
                        </Tooltip>
                        {broken ? (
                          <Button variant="ghost" icon="alert" className="row-open" onClick={() => explainUnavailable(e)}>
                            {t.tags.unavailable}
                          </Button>
                        ) : (
                          <Button variant="ghost" icon="external" className="row-open" onClick={() => openProfile(e.u)}>
                            {t.list.open}
                          </Button>
                        )}
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </motion.ul>
            </AnimatePresence>
          </div>
        ) : (
          <div className="list-empty">
            <p>{empty}</p>
            {q ? (
              <Button variant="ghost" onClick={() => setQuery('')}>
                {t.list.clearSearch}
              </Button>
            ) : (
              hideReviewed && all.length > 0 && (
                <Button variant="ghost" onClick={() => setHide(false)}>
                  {t.list.showReviewed}
                </Button>
              )
            )}
          </div>
        )}

        <div className="list-foot">
          <div className="keys" aria-hidden="true">
            <span><kbd className="kbd">J</kbd><kbd className="kbd">K</kbd>{t.list.keys.move}</span>
            <span><kbd className="kbd">O</kbd>{t.list.keys.open}</span>
            <span><kbd className="kbd">X</kbd>{t.list.keys.review}</span>
            <span><kbd className="kbd">←</kbd><kbd className="kbd">→</kbd>{t.list.keys.page}</span>
          </div>
          <Pagination page={current} pages={pages} onPage={(p) => goPage(p)} />
        </div>
      </Panel>
    </section>
  )
}

/** 1 … 4 5 6 … 71: first, last and the neighbours of the current page. */
function pageItems(page: number, pages: number): (number | '…')[] {
  const want = new Set([0, pages - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < pages))
  const sorted = [...want].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage(p: number): void }) {
  const { t } = useI18n()
  if (pages <= 1) return null
  return (
    <nav className="pager" aria-label={fmt(t.list.page, { n: page + 1, total: pages })}>
      <button type="button" className="pager-btn" aria-label={t.list.prev} disabled={page === 0} onClick={() => onPage(page - 1)}>
        <Icon name="chevronLeft" size={14} />
      </button>
      {pageItems(page, pages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="pager-gap">…</span>
        ) : (
          <button
            key={p}
            type="button"
            className="pager-btn"
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPage(p)}
          >
            {p === page && <motion.span layoutId="pager-sel" className="pager-sel" transition={SPRING} />}
            <span className="pager-num">{p + 1}</span>
          </button>
        ),
      )}
      <button type="button" className="pager-btn" aria-label={t.list.next} disabled={page === pages - 1} onClick={() => onPage(page + 1)}>
        <Icon name="chevronRight" size={14} />
      </button>
    </nav>
  )
}
