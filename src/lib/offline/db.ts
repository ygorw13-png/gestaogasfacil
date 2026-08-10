/**
 * Camada mínima de IndexedDB para o modo offline (sem dependências externas).
 */
const DB_NAME = 'gasfacil-offline';
const DB_VERSION = 1;
export const STORE_QUEUE = 'queue';
export const STORE_META = 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB indisponível neste navegador'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export const idbGetAll = <T>(store: string) => tx<T[]>(store, 'readonly', (s) => s.getAll());
export const idbPut = <T>(store: string, value: T) => tx<IDBValidKey>(store, 'readwrite', (s) => s.put(value as unknown as object));
export const idbDelete = (store: string, key: IDBValidKey) => tx<undefined>(store, 'readwrite', (s) => s.delete(key));
export const idbGet = <T>(store: string, key: IDBValidKey) => tx<T | undefined>(store, 'readonly', (s) => s.get(key));
export const idbClear = (store: string) => tx<undefined>(store, 'readwrite', (s) => s.clear());
