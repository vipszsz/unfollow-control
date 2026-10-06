import type { Entry, Snapshot } from './parse'

export interface Lists {
  notFollowingBack: Entry[]
  mutuals: Entry[]
  fans: Entry[]
  pending: Entry[]
}

export function analyze(s: Snapshot): Lists {
  const followers = new Set(s.followers.map((e) => e.u))
  const following = new Set(s.following.map((e) => e.u))
  return {
    notFollowingBack: s.following.filter((e) => !followers.has(e.u)),
    mutuals: s.following.filter((e) => followers.has(e.u)),
    fans: s.followers.filter((e) => !following.has(e.u)),
    pending: s.pending,
  }
}

/** Most recent export first; same export date falls back to import time. */
export function newest(snaps: Snapshot[]): Snapshot | undefined {
  return [...snaps].sort(
    (a, b) => (b.exportDate ?? '').localeCompare(a.exportDate ?? '') || b.importedAt - a.importedAt,
  )[0]
}
