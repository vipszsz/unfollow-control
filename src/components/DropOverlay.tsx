import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useData } from '../data/store'
import { useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { Icon } from './Icon'

const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files')

/** Drop a zip anywhere in the window to import it. Also stops Electron from opening the dropped file. */
export function DropOverlay() {
  const { t } = useI18n()
  const { importFile } = useData()
  const [over, setOver] = useState(false)
  const depth = useRef(0)

  useEffect(() => {
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return
      e.preventDefault()
      depth.current++
      setOver(true)
    }
    const overFn = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = hasFiles(e) ? 'copy' : 'none'
    }
    const leave = () => {
      depth.current = Math.max(0, depth.current - 1)
      if (!depth.current) setOver(false)
    }
    const drop = (e: DragEvent) => {
      e.preventDefault()
      depth.current = 0
      setOver(false)
      const file = e.dataTransfer?.files[0]
      if (file) importFile(file)
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragover', overFn)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragover', overFn)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [importFile])

  return (
    <AnimatePresence>
      {over && (
        <motion.div
          className="drop-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="drop-card"
            initial={{ scale: 0.94, filter: 'blur(6px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            exit={{ scale: 0.94, filter: 'blur(6px)' }}
            transition={SPRING}
          >
            <span className="dropzone-icon">
              <Icon name="upload" size={22} />
            </span>
            <strong>{t.dropAnywhere}</strong>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
