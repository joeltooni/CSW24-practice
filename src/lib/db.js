// IndexedDB persistence for per-word progress.

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open('ScrabbleTrainer', 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'word' })
      }
    }
  })

export const saveProgress = async (word, status) => {
  const db = await openDB()
  const tx = db.transaction('progress', 'readwrite')
  tx.objectStore('progress').put({ word, status, timestamp: Date.now() })
}

export const getProgress = async () => {
  const db = await openDB()
  const tx = db.transaction('progress', 'readonly')
  const store = tx.objectStore('progress')
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Wipe all saved progress (mastered / needs-practice).
export const clearProgress = async () => {
  const db = await openDB()
  const tx = db.transaction('progress', 'readwrite')
  tx.objectStore('progress').clear()
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
