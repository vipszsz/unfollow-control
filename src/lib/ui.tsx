import { createContext, useContext } from 'react'
import type { Lists } from '../data/analyze'

export type ListKey = keyof Lists
export type View = 'overview' | ListKey

export interface UI {
  openGuide(): void
  openWipe(): void
  view: View
  setView(v: View): void
  /** Text in the header search; filters the open list. */
  query: string
  setQuery(q: string): void
}

export const UIContext = createContext<UI | null>(null)

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI outside UIContext')
  return ctx
}
