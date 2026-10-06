import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { SPRING } from '../lib/motion'

interface Option<T extends string> {
  value: T
  label: string
  content: ReactNode
}

/** Segmented control with a sliding thumb (theme, language). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  label: string
}) {
  const id = useId()
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-label={o.label}
          className="segmented-opt"
          onClick={() => onChange(o.value)}
        >
          {value === o.value && <motion.span layoutId={id} className="segmented-thumb" transition={SPRING} />}
          <span className="segmented-content">{o.content}</span>
        </button>
      ))}
    </div>
  )
}
