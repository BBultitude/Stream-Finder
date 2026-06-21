export function createOpenDb(dbName, dbVersion, storeName, keyPath) {
  let dbPromise = null
  return function openDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion)
        req.onupgradeneeded = (e) => {
          const db = e.target.result
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath })
            store.createIndex('timestamp', 'timestamp')
          }
        }
        req.onsuccess = (e) => resolve(e.target.result)
        req.onerror  = (e) => reject(e.target.error)
      })
    }
    return dbPromise
  }
}
