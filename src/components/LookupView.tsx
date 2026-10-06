import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useData } from '../data/store'
import { fmt, useI18n } from '../i18n'
import { SPRING } from '../lib/motion'
import { useUI } from '../lib/ui'
import { Avatar } from './Avatar'
import { Button } from './Button'
import { Panel, PanelLabel } from './Panel'
import { StatusChip, TagMenu } from './Tags'

/** One account vs. your lists, and how to see which of your follows follow it (approved mockup). */
export function LookupView() {
  const { t, lang } = useI18n()
  const { current, marks, updateMark } = useData()
  const { lookup, openProfile } = useUI()
  const u = lookup ?? ''

  const info = useMemo(() => {
    const following = current?.following.find((e) => e.u === u)
    const follower = current?.followers.find((e) => e.u === u)
    return { following, follower, entry: following ?? follower ?? { u } }
  }, [current, u])

  if (!u) return null
  const iFollow = !!info.following
  const followsMe = !!info.follower
  const rel = iFollow && followsMe ? 'mutual' : iFollow ? 'following' : followsMe ? 'follower' : 'none'
  const m = marks.get(u)
  const month = new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en', { month: 'short', year: 'numeric' })
  const sub = info.following?.t
    ? fmt(t.lookup.sinceFollow, { date: month.format(info.following.t * 1000) })
    : !iFollow && !followsMe
      ? t.lookup.notInLists
      : ''

  const yes = (v: boolean) => <b className={v ? 'yes' : 'no'}>{v ? t.lookup.yes : t.lookup.no}</b>

  return (
    <section className="lookup">
      <div className="lookup-grid">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
          <PanelLabel live>{t.lookup.label}</PanelLabel>
          <Panel tint="blue" className="lookup-card">
            <div className="lookup-who">
              <Avatar username={u} size={56} />
              <div className="row-main">
                <h2 className="lookup-user">@{u}</h2>
                {sub && <span className="row-sub">{sub}</span>}
              </div>
              <StatusChip username={u} mark={m} />
            </div>
            <div className="lookup-stats">
              <div>
                <span>{t.lookup.youFollow}</span>
                {yes(iFollow)}
              </div>
              <div>
                <span>{t.lookup.followsYou}</span>
                {yes(followsMe)}
              </div>
              <div>
                <span>{t.lookup.relation}</span>
                <b>{t.lookup.rel[rel]}</b>
              </div>
            </div>
            <div className="lookup-actions">
              <Button variant="primary" icon="external" onClick={() => openProfile(u)}>
                {t.lookup.see}
              </Button>
              {iFollow && !followsMe && m?.tag !== 'queue' && !m?.unfollowedAt && (
                <Button variant="ghost" icon="queue" onClick={() => updateMark(u, { tag: 'queue' })}>
                  {t.lookup.queue}
                </Button>
              )}
              {iFollow && <TagMenu entry={info.entry} />}
            </div>
          </Panel>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.06 }}>
          <PanelLabel>{t.lookup.whatLabel}</PanelLabel>
          <Panel tint="violet" className="lookup-what">
            <div className="fake-profile" aria-hidden="true">
              <div className="fake-row">
                <Avatar username={u} size={52} />
                <div className="fake-bars">
                  <i style={{ width: '45%' }} />
                  <i style={{ width: '80%' }} />
                  <i style={{ width: '60%' }} />
                </div>
              </div>
              <div className="fake-followed">
                <span className="fake-stack">
                  <i />
                  <i />
                  <i />
                </span>
                {t.lookup.followedBy}
              </div>
            </div>
            <ol className="steps">
              {t.lookup.steps.map((s) => (
                <li key={s}>{fmt(s, { u })}</li>
              ))}
            </ol>
            <p className="lookup-note">{t.lookup.note}</p>
          </Panel>
        </motion.div>
      </div>
    </section>
  )
}
