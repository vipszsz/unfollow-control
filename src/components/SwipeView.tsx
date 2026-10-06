import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import type { Mark } from '../data/db'
import { deckOf, queueOf, type Tag } from '../data/marks'
import type { Entry } from '../data/parse'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING, SPRING_FLICK } from '../lib/motion'
import { useUI } from '../lib/ui'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Icon } from './Icon'
import { Panel } from './Panel'
import { TAG_COLOR } from './Tags'

type Decision = 'unfollow' | 'keep' | 'skip' | Tag

const FLY = 640
const COMMIT = 140

/** Apple's momentum projection (apple-design §6): where a flick would come to rest. */
const project = (v: number, d = 0.998) => ((v / 1000) * d) / (1 - d)

const TINTS = ['blue', 'violet', 'teal', 'amber', 'green', 'sky'] as const
const tintOf = (u: string) => TINTS[[...u].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) % TINTS.length]

/** Tinder-style triage of "not following back": ← unfollow queue, → keep, ↑ skip, 1–3 labels, Z undo. */
export function SwipeView() {
  const { t, lang } = useI18n()
  const { current, lists, marks, updateMark, restoreMark } = useData()
  const { setView, openProfile } = useUI()
  const [skipped, setSkipped] = useState<string[]>([])
  const [front, setFront] = useState<string | null>(null)
  const [history, setHistory] = useState<{ u: string; prev?: Mark; skip?: boolean }[]>([])
  const top = useRef<{ fly(d: Decision): void } | null>(null)

  const month = useMemo(
    () => new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en', { month: 'long', year: 'numeric' }),
    [lang],
  )

  const deck = useMemo(() => {
    // Oldest follows first: the likeliest to be stale.
    const base = deckOf(lists?.notFollowingBack ?? [], marks).sort((a, b) => (a.t ?? Infinity) - (b.t ?? Infinity))
    const skip = new Set(skipped)
    const order = [...base.filter((e) => !skip.has(e.u)), ...skipped.map((u) => base.find((e) => e.u === u)).filter(Boolean)] as Entry[]
    if (front) {
      const i = order.findIndex((e) => e.u === front)
      if (i > 0) order.unshift(...order.splice(i, 1))
    }
    return order
  }, [lists, marks, skipped, front])

  const queued = current ? queueOf(current.following, marks).length : 0
  const card = deck[0]

  function decide(e: Entry, d: Decision) {
    setFront(null)
    if (d === 'skip') {
      setSkipped((s) => [...s.filter((u) => u !== e.u), e.u])
      setHistory((h) => [...h, { u: e.u, skip: true }])
      return
    }
    const patch = d === 'unfollow' ? { tag: 'queue' as const } : d === 'keep' ? { reviewed: true } : { tag: d }
    const prev = updateMark(e.u, patch)
    setHistory((h) => [...h, { u: e.u, prev }])
  }

  function undo() {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    if (last.skip) setSkipped((s) => s.filter((u) => u !== last.u))
    else restoreMark(last.u, last.prev)
    setFront(last.u)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // e.repeat: holding a key down must not decide account after account.
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.dialog, .menu')) return
      if ((e.target as HTMLElement).closest('input, textarea')) return
      const map: Record<string, Decision> = { ArrowLeft: 'unfollow', ArrowRight: 'keep', ArrowUp: 'skip', '1': 'friend', '2': 'maybe', '3': 'brand' }
      if (map[e.key]) {
        e.preventDefault()
        top.current?.fly(map[e.key])
      } else if (e.key === 'z') undo()
      else if ((e.key === 'p' || e.key === ' ') && card) {
        e.preventDefault()
        openProfile(card.u)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <section className="swipe">
      <div className="listview-head">
        <div>
          <h2 className="listview-title">{t.swipe.title}</h2>
          <p className="listview-about">{t.swipe.about}</p>
        </div>
        <div className="swipe-meta">
          <span>{fmt(t.swipe.remaining, { n: new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en').format(deck.length) })}</span>
          <Button variant="ghost" icon="undo" disabled={!history.length} onClick={undo}>
            {t.swipe.undo}
          </Button>
        </div>
      </div>

      <div className="deck">
        {card ? (
          <>
            {deck.slice(1, 3).reverse().map((e, i, arr) => (
              <BackCard key={e.u} entry={e} depth={arr.length - i} />
            ))}
            {/* No exit animation: the card has already flown off, and a lingering
                old card would clear the shared handle after the new one sets it. */}
            <SwipeCard
              key={card.u}
              ref={top}
              entry={card}
              since={card.t ? fmt(t.swipe.since, { date: month.format(card.t * 1000) }) : ''}
              onDecide={(d) => decide(card, d)}
              onPeek={() => openProfile(card.u)}
            />
          </>
        ) : (
          <Panel tint="green" className="deck-done">
            <span className="badge badge-teal">
              <Icon name="check" size={16} />
            </span>
            <h3>{t.swipe.doneTitle}</h3>
            <p>{t.swipe.doneBody}</p>
            {queued > 0 && (
              <Button variant="primary" icon="queue" onClick={() => setView('queue')}>
                {t.swipe.goQueue} · {queued}
              </Button>
            )}
          </Panel>
        )}
      </div>

      {card && (
        <div className="swipe-actions">
          <RoundButton tone="red" label={t.swipe.left} icon="close" onClick={() => top.current?.fly('unfollow')} />
          <RoundButton tone="plain" label={t.swipe.up} icon="skip" small onClick={() => top.current?.fly('skip')} />
          <RoundButton tone="green" label={t.swipe.right} icon="heart" onClick={() => top.current?.fly('keep')} />
          <div className="swipe-tags">
            {(['friend', 'maybe', 'brand'] as const).map((tag, i) => (
              <button key={tag} type="button" className="tag-pill" onClick={() => top.current?.fly(tag)}>
                <i style={{ background: TAG_COLOR[tag] }} />
                {t.tags[tag]}
                <kbd className="kbd">{i + 1}</kbd>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="keys keys-center" aria-hidden="true">
        <span><kbd className="kbd">←</kbd>{t.swipe.keys.left}</span>
        <span><kbd className="kbd">→</kbd>{t.swipe.keys.right}</span>
        <span><kbd className="kbd">↑</kbd>{t.swipe.keys.up}</span>
        <span><kbd className="kbd">1</kbd><kbd className="kbd">2</kbd><kbd className="kbd">3</kbd>{t.swipe.keys.tags}</span>
        <span><kbd className="kbd">P</kbd>{t.swipe.keys.peek}</span>
        <span><kbd className="kbd">Z</kbd>{t.swipe.keys.undo}</span>
      </div>
    </section>
  )
}

function RoundButton({ tone, label, icon, small, onClick }: { tone: 'red' | 'green' | 'plain'; label: string; icon: 'close' | 'heart' | 'skip'; small?: boolean; onClick(): void }) {
  return (
    <button type="button" className={`round round-${tone} ${small ? 'is-small' : ''}`} aria-label={label} onClick={onClick}>
      <Icon name={icon} size={small ? 18 : 24} />
      <span className="round-label">{label}</span>
    </button>
  )
}

function BackCard({ entry, depth }: { entry: Entry; depth: number }) {
  return (
    <motion.div
      className={`card card-back tint-${tintOf(entry.u)}`}
      initial={false}
      animate={{ scale: 1 - depth * 0.05, y: depth * 22, opacity: 1 - depth * 0.3 }}
      transition={SPRING}
    />
  )
}

interface CardProps {
  entry: Entry
  since: string
  onDecide(d: Decision): void
  onPeek(): void
  ref: Ref<{ fly(d: Decision): void }>
}

function SwipeCard({ entry, since, onDecide, onPeek, ref }: CardProps) {
  const { t } = useI18n()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-320, 320], [-14, 14])
  const stampLeft = useTransform(x, [-110, -24], [1, 0])
  const stampRight = useTransform(x, [24, 110], [0, 1])
  const stampUp = useTransform(y, [-110, -24], [1, 0])
  const busy = useRef(false)

  // Commit: keep flying at the release velocity, then hand the decision up.
  function fly(d: Decision, vx = 0, vy = 0) {
    if (busy.current) return
    busy.current = true
    const dirX = d === 'unfollow' ? -1 : d === 'skip' ? 0 : 1
    const opts = { type: 'spring' as const, bounce: 0, duration: 0.45 }
    if (d === 'skip') animate(y, -FLY, { ...opts, velocity: vy })
    else animate(x, dirX * FLY, { ...opts, velocity: vx })
    animate(y, d === 'skip' ? -FLY : y.get() + vy * 0.08, { ...opts, velocity: vy }).then(() => onDecide(d))
  }

  useImperativeHandle(ref, () => ({ fly: (d: Decision) => fly(d) }))

  function onDragEnd(_: unknown, info: PanInfo) {
    const px = x.get() + project(info.velocity.x)
    const py = y.get() + project(info.velocity.y)
    if (px < -COMMIT) fly('unfollow', info.velocity.x, info.velocity.y)
    else if (px > COMMIT) fly('keep', info.velocity.x, info.velocity.y)
    else if (py < -COMMIT && Math.abs(px) < COMMIT) fly('skip', info.velocity.x, info.velocity.y)
    else {
      // Not far enough: spring home, keeping the release velocity (a small bounce, since it was thrown).
      animate(x, 0, { ...SPRING_FLICK, velocity: info.velocity.x })
      animate(y, 0, { ...SPRING_FLICK, velocity: info.velocity.y })
    }
  }

  return (
    <motion.div
      className={`card tint-${tintOf(entry.u)}`}
      style={{ x, y, rotate }}
      drag
      dragMomentum={false}
      dragElastic={1}
      onDragEnd={onDragEnd}
      // Grows from where the first back card sat (scale only: x/y belong to the drag).
      initial={{ scale: 0.95, opacity: 0.75 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={SPRING}
      whileTap={{ cursor: 'grabbing' }}
    >
      <motion.span className="stamp stamp-left" style={{ opacity: stampLeft }}>{t.swipe.left}</motion.span>
      <motion.span className="stamp stamp-right" style={{ opacity: stampRight }}>{t.swipe.right}</motion.span>
      <motion.span className="stamp stamp-up" style={{ opacity: stampUp }}>{t.swipe.up}</motion.span>

      <Avatar username={entry.u} size={112} />
      <h3 className="card-user">@{entry.u}</h3>
      {entry.name && <p className="card-name">{entry.name}</p>}
      {since && <p className="card-since">{since}</p>}
      <Button variant="ghost" icon="external" className="card-peek" onPointerDown={(e) => e.stopPropagation()} onClick={onPeek}>
        {t.swipe.peek}
      </Button>
    </motion.div>
  )
}
