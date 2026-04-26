/**
 * trackingCache.service.ts
 *
 * Caché de tracking en IndexedDB.
 *
 * Ventajas vs sessionStorage:
 *  - Sin límite práctico de tamaño (GB disponibles).
 *  - Persiste entre recargas de pestaña dentro de la misma sesión.
 *  - Se limpia explícitamente al hacer logout (seguridad).
 *
 * Estrategia de caché:
 *  - Solo se cachean días HISTÓRICOS (anteriores a hoy).
 *  - El día actual siempre va a la API (datos en tiempo real).
 *  - Al hacer logout se borra todo el store (privacidad + seguridad).
 */

import type { Tracking } from '@/types/tracking'

const DB_NAME    = 'nautic_cache'
const DB_VERSION = 1
const STORE_NAME = 'trackings'

type CacheEntry = {
  cacheKey: string
  data: Tracking[]
  savedAt: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

export const trackingCacheService = {
  /** Recupera los trackings de un día histórico, o null si no está en caché. */
  async get(cacheKey: string): Promise<Tracking[] | null> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(cacheKey)
        req.onsuccess = () => {
          const entry = req.result as CacheEntry | undefined
          resolve(entry ? entry.data : null)
        }
        req.onerror = () => reject(req.error)
      })
    } catch {
      return null   // IndexedDB no disponible → falla silenciosa
    }
  },

  /** Guarda los trackings de un día histórico en caché. */
  async set(cacheKey: string, data: Tracking[]): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx    = db.transaction(STORE_NAME, 'readwrite')
        const entry: CacheEntry = { cacheKey, data, savedAt: Date.now() }
        tx.objectStore(STORE_NAME).put(entry)
        tx.oncomplete = () => resolve()
        tx.onerror    = () => reject(tx.error)
      })
    } catch { /* IndexedDB no disponible */ }
  },

  /** Elimina TODA la caché (llamar en logout por seguridad). */
  async clear(): Promise<void> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).clear()
        tx.oncomplete = () => resolve()
        tx.onerror    = () => reject(tx.error)
      })
    } catch { /* IndexedDB no disponible */ }
  },
}
