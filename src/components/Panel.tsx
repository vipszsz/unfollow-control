import type { HTMLAttributes } from 'react'

export type Tint = 'blue' | 'teal' | 'violet' | 'amber' | 'green' | 'sky'

interface Props extends HTMLAttributes<HTMLDivElement> {
  tint?: Tint
}

/** Glass surface with an optional grainy gradient tint. */
export function Panel({ tint, className = '', children, ...rest }: Props) {
  return (
    <div className={`panel ${tint ? `tint-${tint}` : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

/** Small label above a panel, in the reference's "bond_price ●" style. */
export function PanelLabel({ children, live }: { children: string; live?: boolean }) {
  return (
    <div className="panel-label">
      <span>{children}</span>
      {live !== undefined && <span className={`dot ${live ? 'dot-live' : ''}`} />}
    </div>
  )
}
