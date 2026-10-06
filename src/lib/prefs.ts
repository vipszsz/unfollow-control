// Small UI preferences (theme, language). Imported data goes to IndexedDB in phase 2.
export function readPref<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(`uc.${key}`)
    if (v && (allowed as readonly string[]).includes(v)) return v as T
  } catch {}
  return fallback
}

export function readNumber(key: string, fallback: number, min: number, max: number): number {
  try {
    const n = Number(localStorage.getItem(`uc.${key}`))
    if (Number.isFinite(n) && n >= min && n <= max) return n
  } catch {}
  return fallback
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(`uc.${key}`, value)
  } catch {}
}

export function openExternal(url: string) {
  if (window.uc) window.uc.openExternal(url)
  else window.open(url, '_blank', 'noopener')
}
