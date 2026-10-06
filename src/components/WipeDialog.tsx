import { useState } from 'react'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { Button } from './Button'
import { Dialog } from './Dialog'

/** The one irreversible action in the app, so it gets a confirmation. */
export function WipeDialog({ open, onClose }: { open: boolean; onClose(): void }) {
  const { t } = useI18n()
  const { snapshots, wipe } = useData()
  const [busy, setBusy] = useState(false)
  const n = snapshots.length
  const what = n === 1 ? t.wipe.one : fmt(t.wipe.many, { n })

  return (
    <Dialog open={open} onClose={onClose} title={t.wipe.title} width={420}>
      <p className="dialog-body">{fmt(t.wipe.body, { n: what })}</p>
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose} data-autofocus>
          {t.wipe.cancel}
        </Button>
        <Button
          variant="danger"
          icon="trash"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await wipe()
            setBusy(false)
            onClose()
          }}
        >
          {t.wipe.confirm}
        </Button>
      </div>
    </Dialog>
  )
}
