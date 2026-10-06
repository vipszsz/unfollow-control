import { unzip, type Unzipped } from 'fflate'

/** One account in a list. `t` is when the relationship started (unix seconds). */
export interface Entry {
  u: string
  t?: number
  name?: string
}

/** Everything the app keeps from one Instagram export. */
export interface Snapshot {
  id: string
  owner?: string
  /** YYYY-MM-DD, from the zip's file name. */
  exportDate?: string
  importedAt: number
  fileName: string
  followers: Entry[]
  following: Entry[]
  /** Follow requests you sent that were never accepted. */
  pending: Entry[]
  recentlyUnfollowed: Entry[]
  closeFriends: Entry[]
}

export type ImportErrorCode = 'not-zip' | 'html' | 'missing' | 'not-instagram'

export class ImportError extends Error {
  code: ImportErrorCode
  missing: string[]
  constructor(code: ImportErrorCode, missing: string[] = []) {
    super(code)
    this.code = code
    this.missing = missing
  }
}

const IN_DIR = /(?:^|\/)followers_and_following\/([^/]+)$/

function readZip(file: File): Promise<Unzipped> {
  return file.arrayBuffer().then((buf) => {
    const bytes = new Uint8Array(buf)
    // Every zip starts with "PK".
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new ImportError('not-zip')
    return new Promise<Unzipped>((resolve, reject) =>
      unzip(bytes, { filter: (f) => IN_DIR.test(f.name) }, (err, out) =>
        err ? reject(new ImportError('not-zip')) : resolve(out),
      ),
    )
  })
}

/** Instagram writes UTF-8 bytes as if they were Latin-1 ("UsuÃ¡rio"). Undo that when it applies. */
export function fixText(s: string): string {
  if (!/[\u0080-ÿ]/.test(s) || /[^\u0000-ÿ]/.test(s)) return s
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(s, (c) => c.charCodeAt(0)))
  } catch {
    return s
  }
}

function userFromHref(href?: string) {
  return href?.match(/instagram\.com\/(?:_u\/)?([^/?#]+)/)?.[1]
}

type Raw = Record<string, unknown>

function toEntry(raw: Raw): Entry | null {
  // Shape 1 (followers, following): { title, string_list_data: [{ href, value?, timestamp }] }
  if (Array.isArray(raw.string_list_data)) {
    const s = (raw.string_list_data[0] ?? {}) as { href?: string; value?: string; timestamp?: number }
    const u = (raw.title as string) || s.value || userFromHref(s.href)
    return u ? { u: u.toLowerCase(), t: s.timestamp } : null
  }
  // Shape 2 (pending, close friends…): { timestamp, label_values: [{ label, value }] }, labels localized.
  if (Array.isArray(raw.label_values)) {
    let u: string | undefined
    let name: string | undefined
    for (const lv of raw.label_values as { label?: string; value?: string }[]) {
      const label = fixText(lv.label ?? '').toLowerCase()
      const value = fixText(lv.value ?? '').trim()
      if (/user|usu|utente|benutzer/.test(label)) u = value
      else if (/^(name|nome|nombre|nom)$/.test(label)) name = value
    }
    return u ? { u: u.toLowerCase(), t: raw.timestamp as number | undefined, name: name || undefined } : null
  }
  return null
}

function entriesOf(json: unknown): Entry[] {
  let list: unknown[] = []
  if (Array.isArray(json)) list = json
  else if (json && typeof json === 'object') {
    const obj = json as Raw
    // A file with a single account is written as that bare object, not a list.
    if (obj.label_values || obj.string_list_data) list = [obj]
    else {
      const rel = Object.entries(obj).find(([k, v]) => k.startsWith('relationships_') && Array.isArray(v))
      list = (rel?.[1] as unknown[]) ?? []
    }
  }
  const seen = new Set<string>()
  const out: Entry[] = []
  for (const raw of list) {
    const e = raw && typeof raw === 'object' ? toEntry(raw as Raw) : null
    if (e && !seen.has(e.u)) {
      seen.add(e.u)
      out.push(e)
    }
  }
  return out
}

/** "instagram-yourname-2026-10-05-AbCd1234.zip" → owner and export date. */
function fromFileName(name: string) {
  const m = name.match(/^instagram-(.+?)-(\d{4}-\d{2}-\d{2})-/i)
  return m ? { owner: m[1].toLowerCase(), exportDate: m[2] } : {}
}

export async function parseExport(file: File): Promise<Snapshot> {
  const files = await readZip(file)
  const byName = new Map<string, Uint8Array>()
  for (const [path, data] of Object.entries(files)) byName.set(path.match(IN_DIR)![1], data)

  if (byName.size === 0) throw new ImportError('not-instagram')

  const names = [...byName.keys()]
  const followerFiles = names.filter((n) => /^followers(_\d+)?\.json$/.test(n))
  const hasFollowing = byName.has('following.json')
  if (!followerFiles.length && !hasFollowing && names.some((n) => n.endsWith('.html'))) throw new ImportError('html')

  const missing = [...(followerFiles.length ? [] : ['followers_1.json']), ...(hasFollowing ? [] : ['following.json'])]
  if (missing.length) throw new ImportError('missing', missing)

  const decoder = new TextDecoder()
  const read = (n: string): Entry[] => {
    const data = byName.get(n)
    if (!data) return []
    try {
      return entriesOf(JSON.parse(decoder.decode(data)))
    } catch {
      return []
    }
  }

  const followers = followerFiles.sort().flatMap(read)
  const following = read('following.json')
  const meta = fromFileName(file.name)

  return {
    id: `${meta.owner ?? 'conta'}-${meta.exportDate ?? 'sem-data'}-${followers.length}-${following.length}`,
    ...meta,
    importedAt: Date.now(),
    fileName: file.name,
    followers: dedupe(followers),
    following,
    pending: read('pending_follow_requests.json'),
    recentlyUnfollowed: read('recently_unfollowed_profiles.json'),
    closeFriends: read('close_friends.json'),
  }
}

function dedupe(list: Entry[]) {
  const seen = new Set<string>()
  return list.filter((e) => !seen.has(e.u) && seen.add(e.u))
}
