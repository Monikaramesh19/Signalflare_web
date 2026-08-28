export interface OfflineSOS {
  id: string; // generated UUID
  emergencyType: string;
  severity: string;
  peopleCount: number;
  locationLat: number;
  locationLng: number;
  address: string;
  message: string;
  contactPhone: string;
  photo?: string; // base64 representation
  createdAt: number;
}

export interface OfflineResourceReq {
  id: string;
  resourceName: string;
  quantity: number;
  locationLat?: number;
  locationLng?: number;
  address?: string;
  contactPhone?: string;
  createdAt: number;
}

export interface OfflineMessage {
  id: string;
  receiverId: string;
  content: string;
  createdAt: number;
}

const DB_NAME = 'signalflare_db';
const DB_VERSION = 2;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open offline database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('sos_queue')) {
        db.createObjectStore('sos_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('resource_queue')) {
        db.createObjectStore('resource_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('message_queue')) {
        db.createObjectStore('message_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('mesh_messages')) {
        db.createObjectStore('mesh_messages', { keyPath: 'messageId' });
      }
      if (!db.objectStoreNames.contains('mesh_peers')) {
        db.createObjectStore('mesh_peers', { keyPath: 'deviceId' });
      }
      if (!db.objectStoreNames.contains('mesh_routes')) {
        db.createObjectStore('mesh_routes', { keyPath: 'id' });
      }
    };
  });
};

export const addToQueue = async (
  storeName: 'sos_queue' | 'resource_queue' | 'message_queue' | 'mesh_messages' | 'mesh_peers' | 'mesh_routes',
  data: any
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to insert into ${storeName}`));
  });
};

export const getQueue = async (
  storeName: 'sos_queue' | 'resource_queue' | 'message_queue' | 'mesh_messages' | 'mesh_peers' | 'mesh_routes'
): Promise<any[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(`Failed to read from ${storeName}`));
  });
};

export const removeFromQueue = async (
  storeName: 'sos_queue' | 'resource_queue' | 'message_queue' | 'mesh_messages' | 'mesh_peers' | 'mesh_routes',
  id: string
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
  });
};

export const clearQueue = async (
  storeName: 'sos_queue' | 'resource_queue' | 'message_queue' | 'mesh_messages' | 'mesh_peers' | 'mesh_routes'
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Failed to clear store ${storeName}`));
  });
};
