import { motion } from 'motion/react'
import { SPRING } from '../lib/motion'

/** Custom on/off switch (never a native checkbox). */
export function Switch({ checked, onChange, label, hideLabel }: { checked: boolean; onChange(v: boolean): void; label: string; hideLabel?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="switch" onClick={() => onChange(!checked)}>
      <span className="switch-track">
        <motion.span className="switch-thumb" animate={{ x: checked ? 14 : 0 }} transition={SPRING} />
      </span>
      <span className={hideLabel ? 'sr-only' : 'switch-label'}>{label}</span>
    </button>
  )
}
