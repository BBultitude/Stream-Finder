'use strict'

/**
 * IMP-02 — Persistent IndexedDB cache for backend API responses.
 *
 * TTLs per endpoint:
 *   /api/new          → 12 hours
 *   /api/trending     → 6 hours
 *   /api/browse       → 6 hours
 *   /api/top10        → 6 hours
 *   /api/coming-soon  → 6 hours
 *   /api/providers    → 24 hours
 *   (default)         → 6 hours
 *
 * Gracefully degrades to no-cache if IndexedDB is unavailable.
 * LRU eviction: prunes 10 oldest entries when store exceeds MAX_ENTRIES.
 */

const DB_NAME = 'streamfinder-cache'
const DB_VERSION = 1
const STORE = 'responses'
const MAX_ENTRIES = 200

const TTL_MAP = [
  ['/api/new',         12 * 3600 * 1000],
  ['/api/trending',     6 * 3600 * 1000],
  ['/api/browse',       6 * 3600 * 1000],
  ['/api/top10',        6 * 3600 * 1000],
  ['/api/coming-soon',  6 * 3600 * 1000],
  ['/api/providers',   24 * 3600 * 1000],
]

function getTtl(url) {
  for (const [prefix, ttl] of TTL_MAP) {
    if (url.startsWith(prefix)) return ttl
  }
  return 6 * 3600 * 1000
}

let dbPromise = null

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (e) => {
        const db = e.target.result
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'url' })
          store.createIndex('timestamp', 'timestamp')
        }
      }
      req.onsuccess = (e) => resolve(e.target.result)
      req.onerror  = (e) => reject(e.target.error)
    })
  }
  return dbPromise
}

export async function cacheGet(url) {
  try {
    const db = await openDb()
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(url)
      req.onsuccess = (e) => {
        const item = e.target.result
        if (!item) { resolve(null); return }
        if (Date.now() - item.timestamp > item.ttl) {
          // Expired — delete and return null
          try {
            const delTx = db.transaction(STORE, 'readwrite')
            delTx.objectStore(STORE).delete(url)
          } catch { /* non-fatal */ }
          resolve(null)
        } else {
          resolve(item.data)
        }
      }
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function cacheSet(url, value) {
  try {
    const db  = await openDb()
    const ttl = getTtl(url)
    await new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      store.put({ url, data: value, timestamp: Date.now(), ttl })
      tx.oncomplete = resolve
      tx.onerror    = (e) => reject(e.target.error)
    })
    evictIfNeeded(db)
  } catch {
    // Cache write failure is non-fatal — app still works without cache
  }
}

function evictIfNeeded(db) {
  try {
    const countTx  = db.transaction(STORE, 'readonly')
    const countReq = countTx.objectStore(STORE).count()
    countReq.onsuccess = (e) => {
      if (e.target.result <= MAX_ENTRIES) return
      const tx    = db.transaction(STORE, 'readwrite')
      const index = tx.objectStore(STORE).index('timestamp')
      const req   = index.openCursor()
      let deleted = 0
      req.onsuccess = (ev) => {
        const cursor = ev.target.result
        if (cursor && deleted < 10) {
          cursor.delete()
          deleted++
          cursor.continue()
        }
      }
    }
  } catch { /* non-fatal */ }
}
