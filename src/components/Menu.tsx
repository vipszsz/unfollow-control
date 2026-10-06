import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SPRING } from '../lib/motion'
import { Icon, type IconName } from './Icon'

export type MenuEntry =
  | { kind?: 'item'; icon: IconName; label: string; hint?: string; danger?: boolean; disabled?: boolean; onSelect?: () => void }
  | { kind: 'divider' }

interface Props {
  entries: MenuEntry[]
  /** Renders the trigger; receives the props that wire it to the menu. */
  trigger: (props: { ref: (el: HTMLButtonElement | null) => void; onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu'; 'aria-controls': string }) => ReactNode
}

/** Custom dropdown menu that grows out of its trigger (never a native <select>). */
export function Menu({ entries, trigger }: Props) {
  const id = useId()
  const btn = useRef<HTMLButtonElement | null>(null)
  const list = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  const items = entries.map((e, i) => ({ e, i })).filter(({ e }) => e.kind !== 'divider' && !e.disabled)

  useLayoutEffect(() => {
    if (!open || !btn.current) return
    const r = btn.current.getBoundingClientRect()
    setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (ev: PointerEvent) => {
      const t = ev.target as Node
      if (!list.current?.contains(t) && !btn.current?.contains(t)) setOpen(false)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setOpen(false)
        btn.current?.focus()
      } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault()
        if (!items.length) return
        const cur = items.findIndex((x) => x.i === active)
        const next = ev.key === 'ArrowDown' ? (cur + 1) % items.length : (cur - 1 + items.length) % items.length
        setActive(items[next].i)
      } else if (ev.key === 'Enter' && active >= 0) {
        ev.preventDefault()
        select(active)
      }
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  })

  function select(i: number) {
    const e = entries[i]
    if (!e || e.kind === 'divider' || e.disabled) return
    setOpen(false)
    e.onSelect?.()
  }

  return (
    <>
      {trigger({
        ref: (el) => (btn.current = el),
        onClick: () => {
          setActive(-1)
          setOpen((o) => !o)
        },
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        'aria-controls': id,
      })}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={list}
              id={id}
              role="menu"
              className="menu"
              style={{ top: pos.top, right: pos.right, transformOrigin: 'top right' }}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
              transition={SPRING}
            >
              {entries.map((e, i) =>
                e.kind === 'divider' ? (
                  <div key={i} className="menu-divider" role="separator" />
                ) : (
                  <div
                    key={i}
                    role="menuitem"
                    aria-disabled={e.disabled || undefined}
                    className={`menu-item ${e.danger ? 'is-danger' : ''} ${active === i ? 'is-active' : ''}`}
                    onPointerEnter={() => !e.disabled && setActive(i)}
                    onPointerLeave={() => setActive(-1)}
                    onClick={() => select(i)}
                  >
                    <Icon name={e.icon} size={15} />
                    <span>{e.label}</span>
                    {e.hint && <span className="menu-hint">{e.hint}</span>}
                  </div>
                ),
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
