import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { readPref, writePref } from '../lib/prefs'
import { en } from './en'
import { pt, type Dict } from './pt'

export const LANGS = ['pt', 'en'] as const
export type Lang = (typeof LANGS)[number]

const DICTS: Record<Lang, Dict> = { pt, en }

interface I18n {
  lang: Lang
  t: Dict
  setLang(lang: Lang): void
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    readPref('lang', LANGS, navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en'),
  )

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    writePref('lang', next)
    setLangState(next)
  }, [])

  const value = useMemo(() => ({ lang, t: DICTS[lang], setLang }), [lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n outside I18nProvider')
  return ctx
}

/** Fill "{name}" placeholders: fmt('Passo {n}', { n: 2 }). */
export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m))
}
