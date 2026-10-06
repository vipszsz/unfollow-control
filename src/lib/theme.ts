import { useCallback, useState } from 'react'
import { readPref, writePref } from './prefs'

export const THEMES = ['dark', 'light'] as const
export type Theme = (typeof THEMES)[number]

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => readPref('theme', THEMES, 'dark'))

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    // Ease the brightness jump instead of flashing (Apple reduced-motion guidance).
    root.classList.add('theme-anim')
    root.dataset.theme = next
    window.setTimeout(() => root.classList.remove('theme-anim'), 450)
    writePref('theme', next)
    setThemeState(next)
  }, [])

  return { theme, setTheme }
}
