// IndexedDB on this computer only. In the Electron app it lives in the app's data folder.
import type { Snapshot } from './parse'

const DB_NAME = 'unfollow-control'

/** What the user decided about one account, per Instagram owner. */
export interface Mark {
  /** `${owner}|${username}` */
  key: string
  reviewed?: boolean
  tag?: 'friend' | 'maybe' | 'brand' | 'queue'
  /** The profile doesn't open (renamed, deactivated, deleted…). */
  unavailable?: boolean
  /** When the user confirmed they unfollowed the account. */
  unfollowedAt?: number
  /** When the tag was last set; orders the unfollow queue. */
  decidedAt?: number
}

type StoreName = 'snapshots' | 'marks'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 2)
    req.onupgradeneeded = () => {
      const d = req.result
      if (!d.objectStoreNames.contains('snapshots')) d.createObjectStore('snapshots', { keyPath: 'id' })
      if (!d.objectStoreNames.contains('marks')) d.createObjectStore('marks', { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        tx.oncomplete = () => {
          db.close()
          resolve(req.result)
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error)
        }
      }),
  )
}

export const db = {
  all: () => run<Snapshot[]>('snapshots', 'readonly', (s) => s.getAll()),
  put: (snap: Snapshot) => run('snapshots', 'readwrite', (s) => s.put(snap)),
  deleteSnapshot: (id: string) => run('snapshots', 'readwrite', (s) => s.delete(id)),
  marks: () => run<Mark[]>('marks', 'readonly', (s) => s.getAll()),
  putMark: (m: Mark) => run('marks', 'readwrite', (s) => s.put(m)),
  deleteMark: (key: string) => run('marks', 'readwrite', (s) => s.delete(key)),
  clear: () => Promise.all([run('snapshots', 'readwrite', (s) => s.clear()), run('marks', 'readwrite', (s) => s.clear())]),
}
