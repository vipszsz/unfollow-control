import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { analyze, newest, type Lists } from './analyze'
import { db } from './db'
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

  useEffect(() => {
    db.all().then(setSnapshots, () => setSnapshots([]))
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
    setJustImported(false)
  }, [])

  const value = useMemo<Data>(() => {
    const current = snapshots ? newest(snapshots) : undefined
    return {
      status: snapshots === null ? 'loading' : current ? 'ready' : 'empty',
      snapshots: snapshots ?? [],
      current,
      lists: current && analyze(current),
      importing,
      error,
      justImported,
      importFile,
      clearError: () => setError(undefined),
      wipe,
    }
  }, [snapshots, importing, error, justImported, importFile, wipe])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useData() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useData outside DataProvider')
  return ctx
}
