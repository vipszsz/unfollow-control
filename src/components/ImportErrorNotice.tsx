import { AnimatePresence, motion } from 'motion/react'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { useUI } from '../lib/ui'
import { Button } from './Button'

/** Explains why an import failed and how to fix it. */
export function ImportErrorNotice() {
  const { t } = useI18n()
  const { error, clearError } = useData()
  const { openGuide } = useUI()

  return (
    <AnimatePresence initial={false}>
      {error && (
        <motion.div
          key={error.code}
          className="import-error"
          role="alert"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={SPRING}
        >
          <div className="import-error-inner">
            <strong>{t.errors[error.code].title}</strong>
            <p>{fmt(t.errors[error.code].body, { files: error.missing.join(', ') })}</p>
            <div className="import-error-actions">
              <Button variant="ghost" onClick={openGuide}>
                {t.errors.retry}
              </Button>
              <Button variant="plain" onClick={clearError}>
                {t.errors.dismiss}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
