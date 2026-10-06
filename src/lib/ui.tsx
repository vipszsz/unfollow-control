import { createContext, useContext } from 'react'
import type { Lists } from '../data/analyze'
import type { Entry } from '../data/parse'

export type ListKey = keyof Lists
export type View = 'overview' | ListKey | 'swipe' | 'queue' | 'history' | 'lookup'

export interface UI {
  openGuide(): void
  openWipe(): void
  /** "Send everyone to the queue" dialog. */
  openBulkQueue(): void
  view: View
  setView(v: View): void
  /** Text in the header search; filters the open list. */
  query: string
  setQuery(q: string): void
  /** Open a profile: in the side panel inside the desktop app, in a new tab in a browser. */
  openProfile(username: string): void
  /** Load any Instagram URL in the side panel (or a new tab in a browser). */
  openInstagram(url: string): void
  panelUrl: string | null
  closePanel(): void
  /** Header button: reopen the panel where it was, or start at Instagram's home. */
  togglePanel(): void
  /** Username shown in the lookup view ("who I follow that follows @x"). */
  lookup: string | null
  openLookup(username: string): void
  /** Explain why a profile won't open, and let the user mark it. */
  explainUnavailable(entry: Entry): void
}

export const UIContext = createContext<UI | null>(null)

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI outside UIContext')
  return ctx
}

/** The Instagram panel needs Electron's <webview>; a plain browser falls back to tabs. */
export const hasPanel = () => Boolean(window.uc)
