import { MotionConfig } from 'motion/react'
import { Header } from './components/Header'
import { TitleBar } from './components/TitleBar'
import { Welcome } from './components/Welcome'
import { I18nProvider } from './i18n'
import { useTheme } from './lib/theme'

export function App() {
  const { theme, setTheme } = useTheme()

  return (
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <div className="backdrop" />
        <div className="app">
          <TitleBar />
          <div className="scroll">
            <main className="shell">
              <Header theme={theme} onTheme={setTheme} />
              <Welcome />
            </main>
          </div>
        </div>
      </MotionConfig>
    </I18nProvider>
  )
}
