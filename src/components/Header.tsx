import { motion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { queueOf } from '../data/marks'
import { useData } from '../data/store'
import { useI18n, type Lang } from '../i18n'
import { SPRING } from '../lib/motion'
import { pickZip } from '../lib/pickFile'
import type { Theme } from '../lib/theme'
import { useUI, type View } from '../lib/ui'
import { Button } from './Button'
import { Icon } from './Icon'
import { Menu } from './Menu'
import { Segmented } from './Segmented'
import { Tooltip } from './Tooltip'

interface Props {
  theme: Theme
  onTheme(t: Theme): void
}

const TABS = ['notFollowingBack', 'mutuals', 'fans', 'pending'] as const

export function Header({ theme, onTheme }: Props) {
  const { t, lang, setLang } = useI18n()
  const { status, lists, snapshots, importing, importFile, current, marks } = useData()
  const { openGuide, openWipe, view, setView, query, setQuery } = useUI()
  const search = useRef<HTMLInputElement>(null)
  const ready = status === 'ready'
  const num = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en')
  const queued = useMemo(() => (current ? queueOf(current.following, marks).length : 0), [current, marks])

  // "/" jumps to the search field from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || !ready || (e.target as HTMLElement).closest('input, textarea') || document.querySelector('.dialog')) return
      e.preventDefault()
      search.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready])

  const pill = (key: View, label: string, count?: number, tone?: 'red') => {
    const on = ready && view === key
    const btn = (
      <button
        type="button"
        className={`pill ${on ? 'is-on' : ''} ${tone ? `pill-${tone}` : ''}`}
        aria-current={on ? 'page' : undefined}
        aria-disabled={!ready || undefined}
        onClick={() => ready && setView(key)}
      >
        {on && <motion.span layoutId="pill-on" className="pill-bg" transition={SPRING} />}
        <span className="pill-text">{label}</span>
        {count !== undefined && <span className="pill-count">{ready ? num.format(count) : '—'}</span>}
      </button>
    )
    return ready ? (
      <span key={key}>{btn}</span>
    ) : (
      <Tooltip key={key} label={t.locked}>
        {btn}
      </Tooltip>
    )
  }

  return (
    <header className="header">
      <div className="header-row">
        <h1 className="brand">{t.appName}</h1>
        <div className="header-actions">
          <Tooltip label={ready ? t.comingSoon : t.locked}>
            <Button variant="plain" icon="history" aria-disabled="true">
              {t.actions.history}
            </Button>
          </Tooltip>
          <Button variant="primary" icon="upload" disabled={importing} onClick={() => pickZip(importFile)}>
            {importing ? t.importing : t.actions.import}
          </Button>
          <Menu
            entries={[
              { icon: 'help', label: t.menu.howTo, onSelect: openGuide },
              { icon: 'code', label: t.menu.github, hint: t.soon, disabled: true },
              { kind: 'divider' },
              snapshots.length
                ? { icon: 'trash', label: t.menu.wipe, danger: true, onSelect: openWipe }
                : { icon: 'trash', label: t.menu.wipe, hint: t.menu.wipeHint, danger: true, disabled: true },
            ]}
            trigger={(p) => <Button {...p} variant="icon" icon="more" aria-label={t.actions.more} />}
          />
        </div>
      </div>

      <div className="header-row">
        <nav className="pills" aria-label={t.list.overview}>
          {pill('overview', t.list.overview)}
          {TABS.map((k) => pill(k, t.nav[k], lists?.[k].length))}
          {ready && (queued > 0 || view === 'queue') && pill('queue', t.queue.title, queued, 'red')}
        </nav>

        <div className="header-actions">
          <Tooltip label={ready ? '' : t.locked}>
            <label className="search" aria-disabled={!ready || undefined}>
              <Icon name="search" size={14} />
              <input
                ref={search}
                className="search-input"
                type="text"
                spellCheck={false}
                autoComplete="off"
                disabled={!ready}
                placeholder={ready && view !== 'overview' ? t.list.search : t.actions.search}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  // Searching from the overview opens the main list.
                  if (view === 'overview' && e.target.value) setView('notFollowingBack')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQuery('')
                    e.currentTarget.blur()
                  }
                }}
              />
              {query ? (
                <button type="button" className="search-clear" aria-label={t.list.clearSearch} onClick={() => setQuery('')}>
                  ×
                </button>
              ) : (
                <kbd className="kbd">/</kbd>
              )}
            </label>
          </Tooltip>
          <Segmented<Theme>
            label={t.theme.label}
            value={theme}
            onChange={onTheme}
            options={[
              { value: 'light', label: t.theme.light, content: <Icon name="sun" size={14} /> },
              { value: 'dark', label: t.theme.dark, content: <Icon name="moon" size={14} /> },
            ]}
          />
          <Segmented<Lang>
            label={t.lang.label}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'pt', label: 'Português', content: 'PT' },
              { value: 'en', label: 'English', content: 'EN' },
            ]}
          />
          <Tooltip label={ready ? '' : t.locked}>
            <Button
              variant={view === 'swipe' && ready ? 'primary' : 'ghost'}
              icon="cards"
              aria-disabled={!ready || undefined}
              aria-pressed={view === 'swipe'}
              onClick={() => ready && setView(view === 'swipe' ? 'notFollowingBack' : 'swipe')}
            >
              {t.actions.swipe}
            </Button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
