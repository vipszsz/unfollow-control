import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { analyze, newest, type Lists } from './analyze'
import { db, type Mark } from './db'
import { isEmptyMark, type MarkPatch } from './marks'
import { ImportError, parseExport, type Snapshot } from './parse'

type Status = 'loading' | 'empty' | 'ready'

interface Data {
  status: Status
  snapshots: Snapshot[]
  current?: Snapshot
  lists?: Lists
  importing: boolean
  error?: ImportError
  /** True right after a successful import, until the next one starts. */
  justImported: boolean
  /** Marks for the current owner, keyed by username. */
  marks: Map<string, Mark>
  toggleReviewed(username: string): void
  /** Merge a change into an account's mark. Returns the previous mark, for undo. */
  updateMark(username: string, patch: MarkPatch): Mark | undefined
  /** Put back exactly what updateMark returned. */
  restoreMark(username: string, previous: Mark | undefined): void
  importFile(file: File): Promise<void>
  clearError(): void
  wipe(): Promise<void>
}

const Ctx = createContext<Data | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<ImportError>()
  const [justImported, setJustImported] = useState(false)
  const [allMarks, setAllMarks] = useState<Map<string, Mark>>(new Map())

  useEffect(() => {
    db.all().then(setSnapshots, () => setSnapshots([]))
    db.marks().then((list) => setAllMarks(new Map(list.map((m) => [m.key, m]))), () => {})
  }, [])

  const importFile = useCallback(async (file: File) => {
    setImporting(true)
    setError(undefined)
    setJustImported(false)
    try {
      const snap = await parseExport(file)
      await db.put(snap)
      setSnapshots((prev) => [...(prev ?? []).filter((s) => s.id !== snap.id), snap])
      setJustImported(true)
    } catch (e) {
      setError(e instanceof ImportError ? e : new ImportError('not-zip'))
    } finally {
      setImporting(false)
    }
  }, [])

  const wipe = useCallback(async () => {
    await db.clear()
    setSnapshots([])
    setAllMarks(new Map())
    setJustImported(false)
  }, [])

  const current = snapshots ? newest(snapshots) : undefined
  const owner = current?.owner ?? ''

  const marks = useMemo(() => {
    const prefix = `${owner}|`
    const out = new Map<string, Mark>()
    for (const [k, m] of allMarks) if (k.startsWith(prefix)) out.set(k.slice(prefix.length), m)
    return out
  }, [allMarks, owner])

  // Latest marks for synchronous reads in updateMark (state may lag a render behind).
  const marksRef = useRef(allMarks)
  marksRef.current = allMarks

  const write = useCallback((key: string, next: Mark | undefined) => {
    const map = new Map(marksRef.current)
    if (next && !isEmptyMark(next)) {
      map.set(key, next)
      db.putMark(next)
    } else {
      map.delete(key)
      db.deleteMark(key)
    }
    marksRef.current = map
    setAllMarks(map)
  }, [])

  const updateMark = useCallback(
    (u: string, patch: MarkPatch) => {
      const key = `${owner}|${u}`
      const prev = marksRef.current.get(key)
      const next: Mark = { ...prev, ...patch, key }
      if ('tag' in patch) next.decidedAt = patch.tag ? Date.now() : undefined
      write(key, next)
      return prev
    },
    [owner, write],
  )

  const restoreMark = useCallback((u: string, previous: Mark | undefined) => write(`${owner}|${u}`, previous), [owner, write])

  const toggleReviewed = useCallback(
    (u: string) => {
      updateMark(u, { reviewed: !marksRef.current.get(`${owner}|${u}`)?.reviewed })
    },
    [owner, updateMark],
  )

  const value = useMemo<Data>(() => {
    return {
      status: snapshots === null ? 'loading' : current ? 'ready' : 'empty',
      snapshots: snapshots ?? [],
      current,
      lists: current && analyze(current),
      importing,
      error,
      justImported,
      marks,
      toggleReviewed,
      updateMark,
      restoreMark,
      importFile,
      clearError: () => setError(undefined),
      wipe,
    }
  }, [snapshots, current, importing, error, justImported, marks, toggleReviewed, updateMark, restoreMark, importFile, wipe])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useData outside DataProvider')
  return ctx
}
