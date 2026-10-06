import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DropOverlay } from './components/DropOverlay'
import { ExportGuide } from './components/ExportGuide'
import { Header } from './components/Header'
import { InstagramPanel } from './components/InstagramPanel'
import { ListView } from './components/ListView'
import { Overview } from './components/Overview'
import { QueueView } from './components/QueueView'
import { SwipeView } from './components/SwipeView'
import { TitleBar } from './components/TitleBar'
import { UnavailableSheet } from './components/UnavailableSheet'
import { Welcome } from './components/Welcome'
import { WipeDialog } from './components/WipeDialog'
import { profileUrl } from './data/marks'
import type { Entry } from './data/parse'
import { DataProvider, useData } from './data/store'
import { I18nProvider } from './i18n'
import { SPRING, SPRING_SLOW } from './lib/motion'
import { openExternal } from './lib/prefs'
import { useTheme } from './lib/theme'
import { hasPanel, UIContext, type View } from './lib/ui'

export function App() {
  return (
    <I18nProvider>
      <DataProvider>
        <MotionConfig reducedMotion="user">
          <Shell />
        </MotionConfig>
      </DataProvider>
    </I18nProvider>
  )
}

const PANEL_WIDTH = 460

function Shell() {
  const { theme, setTheme } = useTheme()
  const { status } = useData()
  const [guide, setGuide] = useState(false)
  const [wipe, setWipe] = useState(false)
  const [view, setViewState] = useState<View>('overview')
  const [query, setQuery] = useState('')
  const [panelUrl, setPanelUrl] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [unavailable, setUnavailable] = useState<{ entry: Entry | null; open: boolean }>({ entry: null, open: false })

  // Leaving a list clears its search; losing the data goes back home.
  const setView = useCallback((v: View) => {
    if (v === 'overview' || v === 'swipe' || v === 'queue') setQuery('')
    setViewState(v)
  }, [])
  useEffect(() => {
    if (status !== 'ready') {
      setViewState('overview')
      setQuery('')
    }
  }, [status])

  const openInstagram = useCallback((url: string) => {
    if (!hasPanel()) return openExternal(url)
    setPanelUrl(url)
    setPanelOpen(true)
  }, [])
  const openProfile = useCallback((u: string) => openInstagram(profileUrl(u)), [openInstagram])

  const ui = useMemo(
    () => ({
      openGuide: () => setGuide(true),
      openWipe: () => setWipe(true),
      view,
      setView,
      query,
      setQuery,
      openProfile,
      openInstagram,
      panelUrl: panelOpen ? panelUrl : null,
      closePanel: () => setPanelOpen(false),
      explainUnavailable: (entry: Entry) => setUnavailable({ entry, open: true }),
    }),
    [view, setView, query, openProfile, openInstagram, panelUrl, panelOpen],
  )
  const screen = status !== 'ready' ? 'welcome' : view

  return (
    <UIContext.Provider value={ui}>
      <div className="backdrop" />
      <div className="app">
        <TitleBar />
        <div className="workspace">
          <div className="scroll">
            <main className="shell">
              <Header theme={theme} onTheme={setTheme} />
              <AnimatePresence mode="wait" initial={false}>
                {status !== 'loading' && (
                  <motion.div
                    key={screen}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(6px)' }}
                    transition={SPRING}
                  >
                    {screen === 'welcome' ? (
                      <Welcome />
                    ) : screen === 'overview' ? (
                      <Overview />
                    ) : screen === 'swipe' ? (
                      <SwipeView />
                    ) : screen === 'queue' ? (
                      <QueueView />
                    ) : (
                      <ListView list={screen} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>

          {/* Parallel, non-blocking panel: content stays usable beside it (apple-design §12).
              Once opened it stays mounted, so the Instagram session and page survive closing. */}
          {panelUrl && (
            <motion.div
              className="panel-dock"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: panelOpen ? PANEL_WIDTH : 0, opacity: panelOpen ? 1 : 0 }}
              transition={SPRING_SLOW}
            >
              <div className="panel-dock-inner" style={{ width: PANEL_WIDTH }}>
                <InstagramPanel url={panelUrl} onClose={() => setPanelOpen(false)} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <DropOverlay />
      <ExportGuide open={guide} onClose={() => setGuide(false)} />
      <WipeDialog open={wipe} onClose={() => setWipe(false)} />
      <UnavailableSheet
        entry={unavailable.entry}
        open={unavailable.open}
        onClose={() => setUnavailable((s) => ({ ...s, open: false }))}
      />
    </UIContext.Provider>
  )
}
