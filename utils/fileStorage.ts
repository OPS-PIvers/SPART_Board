// Utility to handle client-side file storage using IndexedDB
// This avoids cloud storage costs for user uploaded files.

const DB_NAME = 'classroom_files';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const CHANNEL_NAME = 'classroom_files_channel';

interface StoredFile {
  id: string;
  file: Blob;
  name: string;
  type: string;
  createdAt: number;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  createdAt: number;
  size: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;
const broadcastChannel =
  typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

// Event subscribers
type ChangeListener = () => void;
const listeners: Set<ChangeListener> = new Set();

// Notify all listeners (local and via broadcast)
const notifyChange = (localOnly = false) => {
  listeners.forEach((listener) => listener());
  if (!localOnly && broadcastChannel) {
    broadcastChannel.postMessage({ type: 'change' });
  }
};

// Listen for broadcast messages
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    const data = event.data as { type?: string };
    if (data?.type === 'change') {
      notifyChange(true); // Notify local listeners without rebroadcasting
    }
  };
}

const getDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB', request.error);
      dbPromise = null;
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => {
        dbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });

  return dbPromise;
};

export const fileStorage = {
  async saveFile(id: string, file: File): Promise<string> {
    const db = await getDB();
    const storedFile: StoredFile = {
      id,
      file,
      name: file.name,
      type: file.type,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(storedFile);

      request.onsuccess = () => {
        notifyChange();
        resolve(id);
      };
      request.onerror = () => reject(new Error('Failed to save file'));
    });
  },

  async getFile(id: string): Promise<Blob | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        resolve(result ? result.file : null);
      };
      request.onerror = () => reject(new Error('Failed to get file'));
    });
  },

  async getFileMetadata(id: string): Promise<FileMetadata | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredFile | undefined;
        if (result) {
          resolve({
            id: result.id,
            name: result.name,
            type: result.type,
            createdAt: result.createdAt,
            size: result.file.size,
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('Failed to get file metadata'));
    });
  },

  async getAllFiles(): Promise<FileMetadata[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as StoredFile[];
        const metadata = results
          .map((r) => ({
            id: r.id,
            name: r.name,
            type: r.type,
            createdAt: r.createdAt,
            size: r.file.size,
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        resolve(metadata);
      };
      request.onerror = () => reject(new Error('Failed to get all files'));
    });
  },

  async deleteFile(id: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        notifyChange();
        resolve();
      };
      request.onerror = () => reject(new Error('Failed to delete file'));
    });
  },

  subscribe(listener: ChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
