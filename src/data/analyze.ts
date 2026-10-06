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

export interface Diff {
  /** Followed you in the older export, not in the newer one. */
  lost: Entry[]
  gained: Entry[]
  /** You followed them in the older export, not anymore. */
  youUnfollowed: Entry[]
  youFollowed: Entry[]
}

export function compare(newer: Snapshot, older: Snapshot): Diff {
  const minus = (a: Entry[], b: Entry[]) => {
    const set = new Set(b.map((e) => e.u))
    return a.filter((e) => !set.has(e.u))
  }
  return {
    lost: minus(older.followers, newer.followers),
    gained: minus(newer.followers, older.followers),
    youUnfollowed: minus(older.following, newer.following),
    youFollowed: minus(newer.following, older.following),
  }
}

/** Exports of one Instagram account, newest first. */
export function exportsOf(snaps: Snapshot[], owner?: string): Snapshot[] {
  return [...snaps]
    .filter((s) => s.owner === owner)
    .sort((a, b) => (b.exportDate ?? '').localeCompare(a.exportDate ?? '') || b.importedAt - a.importedAt)
}
