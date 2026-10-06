import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { SPRING } from '../lib/motion'

interface Props {
  open: boolean
  onClose(): void
  title: string
  /** Visually hide the title (it still labels the dialog for screen readers). */
  hideTitle?: boolean
  width?: number
  children: ReactNode
}

/** Modal sheet: dims the app behind it and materializes in place (apple-design §12). */
export function Dialog({ open, onClose, title, hideTitle, width = 520, children }: Props) {
  const titleId = useId()
  const surface = useRef<HTMLDivElement>(null)
  const restore = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restore.current = document.activeElement as HTMLElement
    const id = requestAnimationFrame(() => {
      surface.current?.querySelector<HTMLElement>('[data-autofocus], button, [href], [tabindex]:not([tabindex="-1"])')?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      } else if (e.key === 'Tab' && surface.current) {
        // Keep focus inside the dialog.
        const f = surface.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('keydown', onKey, true)
      restore.current?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="dialog-layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onPointerDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={surface}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="dialog"
            style={{ width }}
            initial={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(8px)' }}
            transition={SPRING}
          >
            <h2 id={titleId} className={hideTitle ? 'sr-only' : 'dialog-title'}>
              {title}
            </h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
