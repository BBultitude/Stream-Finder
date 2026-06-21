import { createOpenDb } from './idbUtils.js'

const DB_NAME = 'streamfinder-history'
const DB_VERSION = 1
const STORE = 'searches'
const MAX_HISTORY = 10

const openDb = createOpenDb(DB_NAME, DB_VERSION, STORE, 'query')

export async function getSearchHistory() {
  try {
    const db = await openDb()
    return new Promise((resolve) => {
      const tx    = db.transaction(STORE, 'readonly')
      const index = tx.objectStore(STORE).index('timestamp')
      const req   = index.openCursor(null, 'prev') // newest first
      const items = []
      req.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor && items.length < MAX_HISTORY) {
          items.push(cursor.value.query)
          cursor.continue()
        } else {
          resolve(items)
        }
      }
      req.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function addToSearchHistory(query) {
  const trimmed = query.trim()
  if (!trimmed) return
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      // put upserts — updates timestamp if query already exists
      store.put({ query: trimmed, timestamp: Date.now() })
      tx.oncomplete = resolve
      tx.onerror    = (e) => reject(e.target.error)
    })
    pruneHistory(db)
  } catch { /* non-fatal */ }
}

export async function removeFromSearchHistory(query) {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(query.trim())
      tx.oncomplete = resolve
      tx.onerror    = (e) => reject(e.target.error)
    })
  } catch { /* non-fatal */ }
}

export async function clearSearchHistory() {
  try {
    const db = await openDb()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = resolve
      tx.onerror    = (e) => reject(e.target.error)
    })
  } catch { /* non-fatal */ }
}

async function pruneHistory(db) {
  try {
    const all = await new Promise((resolve) => {
      const tx    = db.transaction(STORE, 'readonly')
      const index = tx.objectStore(STORE).index('timestamp')
      const req   = index.openCursor(null, 'prev')
      const items = []
      req.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) { items.push(cursor.value); cursor.continue() }
        else resolve(items)
      }
      req.onerror = () => resolve([])
    })
    if (all.length <= MAX_HISTORY) return
    const tx    = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    for (const item of all.slice(MAX_HISTORY)) store.delete(item.query)
  } catch { /* non-fatal */ }
}
