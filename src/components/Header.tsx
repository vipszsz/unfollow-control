import { useData } from '../data/store'
import { useI18n, type Lang } from '../i18n'
import { pickZip } from '../lib/pickFile'
import type { Theme } from '../lib/theme'
import { useUI } from '../lib/ui'
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
  const { status, lists, snapshots, importing, importFile } = useData()
  const { openGuide, openWipe } = useUI()
  const ready = status === 'ready'
  const locked = ready ? t.comingSoon : t.locked
  const num = new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : 'en')

  return (
    <header className="header">
      <div className="header-row">
        <h1 className="brand">{t.appName}</h1>
        <div className="header-actions">
          <Tooltip label={locked}>
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
            trigger={(p) => (
              <Button {...p} variant="icon" icon="more" aria-label={t.actions.more} />
            )}
          />
        </div>
      </div>

      <div className="header-row">
        <nav className="pills" aria-label="Listas">
          {TABS.map((k, i) => (
            <Tooltip key={k} label={locked}>
              <button type="button" className={`pill ${i === 0 ? 'is-on' : ''}`} aria-disabled="true">
                {t.nav[k]}
                <span className="pill-count">{lists ? num.format(lists[k].length) : '—'}</span>
              </button>
            </Tooltip>
          ))}
        </nav>

        <div className="header-actions">
          <Tooltip label={locked}>
            <div className="search" aria-disabled="true">
              <Icon name="search" size={14} />
              <span className="search-placeholder">{t.actions.search}</span>
              <kbd className="kbd">/</kbd>
            </div>
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
          <Tooltip label={locked}>
            <Button variant="ghost" icon="cards" aria-disabled="true">
              {t.actions.swipe}
            </Button>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
