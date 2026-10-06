import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { queueOf, unfollowedToday } from '../data/marks'
import type { Entry } from '../data/parse'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { readNumber, writePref } from '../lib/prefs'
import { hasPanel, useUI } from '../lib/ui'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Panel, PanelLabel } from './Panel'

/**
 * Work through the unfollow queue: the current account's profile opens in the Instagram panel,
 * the user unfollows there, then confirms here and the next one loads.
 */
export function QueueView() {
  const { t, lang } = useI18n()
  const { current, marks, updateMark } = useData()
  const { openProfile, explainUnavailable, setView } = useUI()
  const items = useMemo(() => (current ? queueOf(current.following, marks) : []), [current, marks])
  const now = items[0]
  const today = unfollowedToday(marks)
  const [goal, setGoalState] = useState(() => readNumber('dailyGoal', 30, 5, 200))
  const setGoal = (g: number) => {
    const v = Math.min(200, Math.max(5, g))
    writePref('dailyGoal', String(v))
    setGoalState(v)
  }
  const opened = useRef<string | null>(null)

  const locale = lang === 'pt' ? 'pt-BR' : 'en'
  const month = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }), [locale])
  const since = (e: Entry) => (e.t ? fmt(t.list.since.notFollowingBack, { date: month.format(e.t * 1000) }) : '')

  // In the desktop app, the next profile loads by itself. (In a browser that would spam tabs.)
  useEffect(() => {
    if (now && hasPanel() && opened.current !== now.u) {
      opened.current = now.u
      openProfile(now.u)
    }
  }, [now, openProfile])

  const done = () => now && updateMark(now.u, { unfollowedAt: Date.now() })
  const keep = () => now && updateMark(now.u, { tag: undefined, reviewed: true })
  const broken = () => now && explainUnavailable(now)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // e.repeat: holding a key down must not decide account after account.
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.dialog, .menu')) return
      if ((e.target as HTMLElement).closest('input, textarea')) return
      if (e.key === 'd') done()
      else if (e.key === 'n') broken()
      else if (e.key === 'm') keep()
      else if (e.key === 'o' && now) openProfile(now.u)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className="queue">
      <div className="listview-head">
        <div>
          <h2 className="listview-title">
            {t.queue.title} <span className="listview-count">{items.length}</span>
          </h2>
          <p className="listview-about">{t.queue.about}</p>
        </div>
        <div className="goal" role="group" aria-label={t.goal.label}>
          <span className="goal-text">{fmt(t.goal.progress, { n: today, goal })}</span>
          <span className="meter meter-sm goal-meter">
            <motion.span
              className={`meter-fill ${today >= goal ? 'is-done' : ''}`}
              initial={false}
              animate={{ scaleX: Math.min(today / goal, 1) }}
              transition={SPRING}
            />
          </span>
          <span className="goal-step">
            <Button variant="icon" icon="minus" aria-label={t.goal.less} onClick={() => setGoal(goal - 5)} />
            <Button variant="icon" icon="plus" aria-label={t.goal.more} onClick={() => setGoal(goal + 5)} />
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {today >= goal && (
          <motion.div
            className="notice"
            role="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING}
          >
            <span className="notice-dot" />
            {t.goal.reached}
          </motion.div>
        )}
      </AnimatePresence>

      {now ? (
        <>
          <PanelLabel live>{t.queue.now.toLowerCase()}</PanelLabel>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={now.u}
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
              transition={SPRING}
            >
              <Panel tint="amber" className="queue-now">
                <Avatar username={now.u} size={56} />
                <div className="row-main">
                  <span className="queue-user">@{now.u}</span>
                  <span className="row-sub">{since(now)}</span>
                </div>
                <div className="queue-actions">
                  <Button variant="ghost" icon="external" onClick={() => openProfile(now.u)}>
                    {t.list.open}
                  </Button>
                  <Button variant="plain" icon="alert" onClick={broken}>
                    {t.queue.unavailable}
                  </Button>
                  <Button variant="plain" icon="heart" onClick={keep}>
                    {t.queue.keep}
                  </Button>
                  <Button variant="primary" icon="check" onClick={done}>
                    {t.queue.done}
                  </Button>
                </div>
              </Panel>
            </motion.div>
          </AnimatePresence>

          {items.length > 1 && (
            <ul className="queue-next">
              <AnimatePresence initial={false}>
                {items.slice(1, 8).map((e) => (
                  <motion.li
                    key={e.u}
                    layout="position"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={SPRING}
                  >
                    <Avatar username={e.u} size={26} />
                    <span className="queue-next-user">@{e.u}</span>
                    <span className="row-sub">{since(e)}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {items.length > 8 && <li className="queue-more">{fmt(t.overview.andMore, { n: items.length - 8 })}</li>}
            </ul>
          )}

          <div className="keys" aria-hidden="true">
            <span><kbd className="kbd">D</kbd>{t.queue.keys.done}</span>
            <span><kbd className="kbd">N</kbd>{t.queue.keys.unavailable}</span>
            <span><kbd className="kbd">M</kbd>{t.queue.keys.keep}</span>
            <span><kbd className="kbd">O</kbd>{t.list.keys.open}</span>
          </div>
        </>
      ) : (
        <Panel tint="sky" className="deck-done">
          <h3>{t.queue.empty}</h3>
          <p>{t.queue.emptyHint}</p>
          <Button variant="primary" icon="cards" onClick={() => setView('swipe')}>
            {t.queue.openSwipe}
          </Button>
        </Panel>
      )}
    </section>
  )
}
