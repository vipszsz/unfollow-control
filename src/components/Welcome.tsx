import { motion } from 'motion/react'
import { useData } from '../data/store'
import { useI18n } from '../i18n'
import { SPRING_SLOW } from '../lib/motion'
import { pickZip } from '../lib/pickFile'
import { useUI } from '../lib/ui'
import { Icon, type IconName } from './Icon'
import { ImportErrorNotice } from './ImportErrorNotice'
import { Panel, PanelLabel, type Tint } from './Panel'

const PRIVACY: { key: 'noLogin' | 'offline' | 'local'; icon: IconName; tint: Tint; label: string }[] = [
  { key: 'noLogin', icon: 'lock', tint: 'blue', label: 'no_login' },
  { key: 'offline', icon: 'wifiOff', tint: 'violet', label: 'offline' },
  { key: 'local', icon: 'laptop', tint: 'teal', label: 'local_only' },
]

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { ...SPRING_SLOW, delay: 0.05 + i * 0.06 },
})

/** Empty state shown until a zip is imported. Drops anywhere in the window are handled by DropOverlay. */
export function Welcome() {
  const { t } = useI18n()
  const { importing, error, importFile } = useData()
  const { openGuide } = useUI()
  const pick = () => !importing && pickZip(importFile)

  return (
    <section className="welcome">
      <div className="welcome-hero">
        <motion.p className="eyebrow" {...rise(0)}>{t.welcome.eyebrow}</motion.p>
        <motion.h2 className="display" {...rise(1)}>{t.welcome.title}</motion.h2>
        <motion.p className="lede" {...rise(2)}>{t.welcome.body}</motion.p>
      </div>

      <motion.div {...rise(3)}>
        <PanelLabel live={importing}>import_zip</PanelLabel>
        <Panel
          tint="sky"
          className={`dropzone ${importing ? 'is-busy' : ''}`}
          role="button"
          tabIndex={0}
          aria-busy={importing}
          onClick={pick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick())}
        >
          <span className="dropzone-icon">
            {importing ? <span className="spinner" /> : <Icon name="zip" size={22} />}
          </span>
          <strong>{importing ? t.importing : t.welcome.drop}</strong>
          {!importing && <span className="dropzone-hint">{t.welcome.dropHint}</span>}
        </Panel>

        <ImportErrorNotice />

        {!error && (
          <button type="button" className="link" onClick={openGuide}>
            {t.welcome.howTo}
            <Icon name="arrowRight" size={13} />
          </button>
        )}
      </motion.div>

      <div className="privacy">
        {PRIVACY.map((p, i) => (
          <motion.div key={p.key} {...rise(4 + i)}>
            <PanelLabel live>{p.label}</PanelLabel>
            <Panel tint={p.tint} className="privacy-card">
              <span className={`badge badge-${p.tint}`}>
                <Icon name={p.icon} size={15} />
              </span>
              <h3>{t.privacy[p.key].title}</h3>
              <p>{t.privacy[p.key].body}</p>
            </Panel>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
