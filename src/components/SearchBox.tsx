import { AnimatePresence, motion } from 'motion/react'
import { forwardRef, useMemo, useState } from 'react'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { useUI } from '../lib/ui'
import { Avatar } from './Avatar'
import { Icon } from './Icon'

const LIST_VIEWS = ['notFollowingBack', 'mutuals', 'fans', 'pending']
const USERNAME = /^[a-z0-9._]{1,30}$/

type Option = { u: string; rel?: 'mutual' | 'following' | 'follower'; outside?: boolean }

/**
 * Header search. On a list it filters that list; anywhere else it looks up an account
 * across all your lists and opens "who I follow that follows @x".
 */
export const SearchBox = forwardRef<HTMLInputElement, { disabled: boolean }>(function SearchBox({ disabled }, ref) {
  const { t } = useI18n()
  const { current } = useData()
  const { view, query, setQuery, openLookup } = useUI()
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(0)
  const filtering = LIST_VIEWS.includes(view)

  const index = useMemo(() => {
    const map = new Map<string, Option['rel']>()
    for (const e of current?.following ?? []) map.set(e.u, 'following')
    for (const e of current?.followers ?? []) map.set(e.u, map.has(e.u) ? 'mutual' : 'follower')
    return map
  }, [current])

  const q = query.trim().replace(/^@/, '').toLowerCase()
  const options = useMemo<Option[]>(() => {
    if (filtering || !q) return []
    const hits: Option[] = []
    for (const [u, rel] of index) if (u.includes(q)) hits.push({ u, rel })
    hits.sort((a, b) => Number(!a.u.startsWith(q)) - Number(!b.u.startsWith(q)) || a.u.length - b.u.length)
    const out = hits.slice(0, 6)
    if (!index.has(q) && USERNAME.test(q)) out.push({ u: q, outside: true })
    return out
  }, [filtering, q, index])

  const open = focused && !filtering && q.length > 0
  const pick = (o?: Option) => {
    if (!o) return
    setQuery('')
    ;(document.activeElement as HTMLElement | null)?.blur()
    openLookup(o.u)
  }

  return (
    <label className="search" aria-disabled={disabled || undefined}>
      <Icon name="search" size={14} />
      <input
        ref={ref}
        className="search-input"
        type="text"
        spellCheck={false}
        autoComplete="off"
        role={filtering ? undefined : 'combobox'}
        aria-expanded={filtering ? undefined : open}
        disabled={disabled}
        placeholder={filtering ? t.list.search : t.lookup.searchAll}
        value={query}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('')
            e.currentTarget.blur()
          } else if (open && e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((a) => Math.min(a + 1, options.length - 1))
          } else if (open && e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((a) => Math.max(a - 1, 0))
          } else if (open && e.key === 'Enter') {
            pick(options[active])
          }
        }}
      />
      {query ? (
        <button type="button" className="search-clear" aria-label={t.list.clearSearch} onClick={() => setQuery('')}>
          ×
        </button>
      ) : (
        <kbd className="kbd">/</kbd>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="search-menu"
            role="listbox"
            initial={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.97, filter: 'blur(4px)' }}
            transition={SPRING}
          >
            <div className="search-menu-label">{t.lookup.inLists}</div>
            {options.length ? (
              options.map((o, i) => (
                <div
                  key={o.u + (o.outside ? '-out' : '')}
                  role="option"
                  aria-selected={i === active}
                  className={`menu-item ${i === active ? 'is-active' : ''}`}
                  onPointerEnter={() => setActive(i)}
                  // pointerdown so the pick happens before the input's blur closes the menu
                  onPointerDown={(e) => {
                    e.preventDefault()
                    pick(o)
                  }}
                >
                  {o.outside ? <span className="avatar search-at">@</span> : <Avatar username={o.u} size={24} />}
                  <span>{o.outside ? fmt(t.lookup.outside, { q: o.u }) : `@${o.u}`}</span>
                  <span className="menu-hint">{o.outside ? t.lookup.outsideHint : t.lookup.rel[o.rel!]}</span>
                </div>
              ))
            ) : (
              <div className="menu-item search-nothing">{t.lookup.nothing}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </label>
  )
})
