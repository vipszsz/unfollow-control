import type { Mark } from './db'
import type { Entry } from './parse'

/** Colored labels. friend/brand mean "keep", maybe means "look again later", queue means "unfollow". */
export const TAGS = ['friend', 'maybe', 'brand', 'queue'] as const
export type Tag = (typeof TAGS)[number]

export type MarkPatch = Partial<Omit<Mark, 'key'>>

/** Accounts deleted since you followed them show up as "__deleted__xyz" in the export. */
export const isDeleted = (u: string) => u.startsWith('__deleted__')

export const profileUrl = (u: string) => `https://www.instagram.com/${u}/`

/** Profile can't be opened: deleted in the export, or the user said so. */
export const isUnavailable = (u: string, m?: Mark) => isDeleted(u) || !!m?.unavailable

/** Anything the user already decided about this account. */
export const isHandled = (m?: Mark) => !!(m && (m.reviewed || m.tag || m.unavailable || m.unfollowedAt))

/** True if the mark carries no information and can be deleted. */
export const isEmptyMark = (m: Mark) => !m.reviewed && !m.tag && !m.unavailable && !m.unfollowedAt

/** Accounts waiting in the unfollow queue, oldest decision first. */
export function queueOf(following: Entry[], marks: Map<string, Mark>) {
  return following
    .filter((e) => {
      const m = marks.get(e.u)
      return m?.tag === 'queue' && !m.unfollowedAt && !isUnavailable(e.u, m)
    })
    .sort((a, b) => (marks.get(a.u)?.decidedAt ?? 0) - (marks.get(b.u)?.decidedAt ?? 0))
}

/** Swipe deck: not following back, not decided yet, profile not known to be broken. */
export function deckOf(notFollowingBack: Entry[], marks: Map<string, Mark>) {
  return notFollowingBack.filter((e) => !isDeleted(e.u) && !isHandled(marks.get(e.u)))
}

const DAY = 86_400_000
export function unfollowedToday(marks: Map<string, Mark>, now = Date.now()) {
  const start = new Date(now).setHours(0, 0, 0, 0)
  let n = 0
  for (const m of marks.values()) if (m.unfollowedAt && m.unfollowedAt >= start && m.unfollowedAt < start + DAY) n++
  return n
}
