import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { DropOverlay } from './components/DropOverlay'
import { ExportGuide } from './components/ExportGuide'
import { Header } from './components/Header'
import { Overview } from './components/Overview'
import { TitleBar } from './components/TitleBar'
import { Welcome } from './components/Welcome'
import { WipeDialog } from './components/WipeDialog'
import { DataProvider, useData } from './data/store'
import { I18nProvider } from './i18n'
import { SPRING } from './lib/motion'
import { useTheme } from './lib/theme'
import { UIContext } from './lib/ui'

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

function Shell() {
  const { theme, setTheme } = useTheme()
  const { status } = useData()
  const [guide, setGuide] = useState(false)
  const [wipe, setWipe] = useState(false)
  const ui = useMemo(() => ({ openGuide: () => setGuide(true), openWipe: () => setWipe(true) }), [])

  return (
    <UIContext.Provider value={ui}>
      <div className="backdrop" />
      <div className="app">
        <TitleBar />
        <div className="scroll">
          <main className="shell">
            <Header theme={theme} onTheme={setTheme} />
            <AnimatePresence mode="wait" initial={false}>
              {status !== 'loading' && (
                <motion.div
                  key={status}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, filter: 'blur(6px)' }}
                  transition={SPRING}
                >
                  {status === 'ready' ? <Overview /> : <Welcome />}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
      <DropOverlay />
      <ExportGuide open={guide} onClose={() => setGuide(false)} />
      <WipeDialog open={wipe} onClose={() => setWipe(false)} />
    </UIContext.Provider>
  )
}
