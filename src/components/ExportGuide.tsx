import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { pickZip } from '../lib/pickFile'
import { openExternal } from '../lib/prefs'
import { Button } from './Button'
import { Dialog } from './Dialog'
import { Icon } from './Icon'

const ACCOUNTS_CENTER = 'https://accountscenter.instagram.com/info_and_permissions/dyi/'

/** Which illustrated row each step points at. Step 4 shows checkboxes. */
const HIGHLIGHT = [0, 2, 1, 0, 1]

export function ExportGuide({ open, onClose }: { open: boolean; onClose(): void }) {
  const { t } = useI18n()
  const { importFile } = useData()
  const steps = t.guide.steps
  const [[step, dir], setStep] = useState<[number, number]>([0, 1])
  const last = step === steps.length - 1

  useEffect(() => {
    if (open) setStep([0, 1])
  }, [open])

  const go = (to: number) => {
    if (to < 0 || to >= steps.length) return
    setStep([to, to > step ? 1 : -1])
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(step + 1)
      if (e.key === 'ArrowLeft') go(step - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const s = steps[step]

  return (
    <Dialog open={open} onClose={onClose} title={t.guide.title} width={640}>
      <div className="guide">
        <div className="guide-stage">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              className="guide-slide"
              // Enter and exit along the same axis the user is moving (apple-design §7).
              variants={{
                enter: (d: number) => ({ x: d * 48, opacity: 0, filter: 'blur(6px)' }),
                center: { x: 0, opacity: 1, filter: 'blur(0px)' },
                exit: (d: number) => ({ x: d * -48, opacity: 0, filter: 'blur(6px)' }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
            >
              <Screen step={step} title={s.screen} rows={s.rows} />
              <div className="guide-text">
                <span className="guide-count">{fmt(t.guide.step, { n: step + 1, total: steps.length })}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                {step === 0 && (
                  <Button variant="ghost" icon="external" onClick={() => openExternal(ACCOUNTS_CENTER)}>
                    {t.guide.openAccounts}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="guide-nav">
          <div className="guide-dots" role="tablist" aria-label={t.guide.title}>
            {steps.map((x, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === step}
                aria-label={x.title}
                className="guide-dot"
                onClick={() => go(i)}
              />
            ))}
          </div>
          <div className="dialog-actions">
            {step > 0 && (
              <Button variant="plain" onClick={() => go(step - 1)}>
                {t.guide.back}
              </Button>
            )}
            {last ? (
              <Button
                variant="primary"
                icon="upload"
                onClick={() =>
                  pickZip((f) => {
                    onClose()
                    importFile(f)
                  })
                }
              >
                {t.pickZip}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => go(step + 1)} data-autofocus>
                {t.guide.next}
                <Icon name="arrowRight" size={13} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}

/** Schematic of the Instagram screen for a step, with the target row highlighted. */
function Screen({ step, title, rows }: { step: number; title: string; rows: string[] }) {
  if (!rows.length) {
    return (
      <div className="guide-screen is-file">
        <span className="guide-zip">
          <Icon name="zip" size={28} />
        </span>
        <span className="guide-filename">{title}</span>
        <span className="guide-drop">
          <Icon name="upload" size={14} />
        </span>
      </div>
    )
  }
  return (
    <div className="guide-screen">
      <div className="guide-screen-bar">
        <span className="guide-screen-back">‹</span>
        <span>{title}</span>
      </div>
      {rows.map((r, i) => {
        const hi = HIGHLIGHT[step] === i
        return (
          <div key={r} className={`guide-row ${hi ? 'is-hi' : ''}`}>
            {step === 3 && <span className={`guide-check ${i === 0 ? 'is-on' : ''}`} />}
            <span className="guide-label">{r}</span>
            {step !== 3 && <span className="guide-chev">›</span>}
            {hi && (
              <motion.span
                className="guide-pointer"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...SPRING, delay: 0.25 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
