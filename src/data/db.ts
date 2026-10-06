// IndexedDB on this computer only. In the Electron app it lives in the app's data folder.
import type { Snapshot } from './parse'

const DB_NAME = 'unfollow-control'
const STORE = 'snapshots'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
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
  all: () => run<Snapshot[]>('readonly', (s) => s.getAll()),
  put: (snap: Snapshot) => run('readwrite', (s) => s.put(snap)),
  clear: () => run('readwrite', (s) => s.clear()),
}
