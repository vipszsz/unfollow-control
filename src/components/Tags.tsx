import type { Mark } from '../data/db'
import { isDeleted, TAGS, type Tag } from '../data/marks'
import { useData } from '../data/store'
import { useI18n } from '../i18n'
import type { Entry } from '../data/parse'
import { useUI } from '../lib/ui'
import { Button } from './Button'
import { Menu } from './Menu'

/** CSS color for each label: green keep, yellow maybe, amber brand, red unfollow. */
export const TAG_COLOR: Record<Tag, string> = {
  friend: 'var(--green)',
  maybe: 'var(--yellow)',
  brand: 'var(--amber)',
  queue: 'var(--red)',
}

/** The one status chip an account shows: unfollowed > won't open > its label. */
export function StatusChip({ username, mark }: { username: string; mark?: Mark }) {
  const { t } = useI18n()
  if (mark?.unfollowedAt) return <span className="chip chip-done">{t.tags.unfollowed}</span>
  if (mark?.unavailable || isDeleted(username)) return <span className="chip chip-muted">{t.tags.unavailable}</span>
  if (mark?.tag)
    return (
      <span className={`chip chip-${mark.tag}`}>
        <i style={{ background: TAG_COLOR[mark.tag] }} />
        {t.tags[mark.tag]}
      </span>
    )
  return null
}

/** Label menu for one account: the four labels, "won't open", and clear. */
export function TagMenu({ entry }: { entry: Entry }) {
  const { t } = useI18n()
  const { marks, updateMark } = useData()
  const { explainUnavailable } = useUI()
  const m = marks.get(entry.u)
  const deleted = isDeleted(entry.u)

  return (
    <Menu
      entries={[
        ...TAGS.map((tag) => ({
          dot: TAG_COLOR[tag],
          label: t.tags[tag],
          checked: m?.tag === tag,
          disabled: deleted && tag === 'queue',
          onSelect: () => updateMark(entry.u, { tag: m?.tag === tag ? undefined : tag }),
        })),
        { kind: 'divider' as const },
        { icon: 'alert' as const, label: t.tags.unavailable, checked: !!m?.unavailable || deleted, onSelect: () => explainUnavailable(entry) },
        ...(m?.tag ? [{ icon: 'close' as const, label: t.tags.clear, onSelect: () => updateMark(entry.u, { tag: undefined }) }] : []),
      ]}
      trigger={(p) => <Button {...p} variant="icon" icon="tag" aria-label={t.tags.menu} />}
    />
  )
}
