import { motion } from 'motion/react'
import { useState } from 'react'
import { useI18n } from '../i18n'
import { SPRING_SLOW } from '../lib/motion'
import { Icon, type IconName } from './Icon'
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

/** Empty state shown until a zip is imported. The dropzone becomes functional in phase 2. */
export function Welcome() {
  const { t } = useI18n()
  const [over, setOver] = useState(false)

  return (
    <section className="welcome">
      <div className="welcome-hero">
        <motion.p className="eyebrow" {...rise(0)}>{t.welcome.eyebrow}</motion.p>
        <motion.h2 className="display" {...rise(1)}>{t.welcome.title}</motion.h2>
        <motion.p className="lede" {...rise(2)}>{t.welcome.body}</motion.p>
      </div>

      <motion.div {...rise(3)}>
        <PanelLabel live={false}>import_zip</PanelLabel>
        <Panel
          tint="sky"
          className={`dropzone ${over ? 'is-over' : ''}`}
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
          }}
        >
          <span className="dropzone-icon">
            <Icon name="zip" size={22} />
          </span>
          <strong>{t.welcome.drop}</strong>
          <span className="dropzone-hint">{t.welcome.dropHint}</span>
        </Panel>
        <button type="button" className="link" aria-disabled="true">
          {t.welcome.howTo}
          <Icon name="arrowRight" size={13} />
        </button>
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
