import { AnimatePresence, motion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SPRING } from '../lib/motion'

const DELAY = 450
const GAP = 8
const EDGE = 12

/** Custom tooltip (never the native title=""). Shows on hover or keyboard focus. */
export function Tooltip({ label, children }: { label: ReactNode; children: ReactNode }) {
  const anchor = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const timer = useRef<number>(0)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const show = (delay: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(true), delay)
  }
  const hide = () => {
    window.clearTimeout(timer.current)
    setOpen(false)
  }

  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return
    const a = anchor.current.getBoundingClientRect()
    const w = tip.current.offsetWidth
    const x = Math.min(Math.max(a.left + a.width / 2 - w / 2, EDGE), window.innerWidth - w - EDGE)
    setPos({ x, y: a.bottom + GAP })
  }, [open])

  return (
    <span
      ref={anchor}
      className="tooltip-anchor"
      onPointerEnter={() => show(DELAY)}
      onPointerLeave={hide}
      onPointerDown={hide}
      onFocus={() => show(0)}
      onBlur={hide}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={tip}
              role="tooltip"
              className="tooltip"
              style={{ left: pos.x, top: pos.y }}
              initial={{ opacity: 0, y: -4, scale: 0.96, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -4, scale: 0.96, filter: 'blur(3px)' }}
              transition={SPRING}
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </span>
  )
}
