import type { Entry } from "@/components/demo-store";

export type TimelineCacheSnapshot = {
  savedAt: number;
  familyName: string;
  ownerLabel: string;
  memberLabel: string;
  child: { id?: string; nickname: string; birthDate: string } | null;
  entries: Entry[];
};

const DB_NAME = "little-moment-cache";
const STORE_NAME = "timeline";
const DB_VERSION = 1;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const memoryCache = new Map<string, TimelineCacheSnapshot>();

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function stripPhotoData(entry: Entry): Entry {
  return { ...entry, photos: entry.photos.map((photo) => ({ ...photo, previewUrl: photo.previewUrl?.startsWith("data:") ? undefined : photo.previewUrl, dataUrl: undefined })) };
}

export async function readTimelineCache(key: string) {
  const memory = memoryCache.get(key);
  if (memory && Date.now() - memory.savedAt < MAX_AGE) return memory;

  const db = await openDb();
  if (!db) return null;
  const snapshot = await new Promise<TimelineCacheSnapshot | null>((resolve) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => resolve(null);
  });
  db.close();
  if (!snapshot || Date.now() - snapshot.savedAt >= MAX_AGE) return null;
  memoryCache.set(key, snapshot);
  return snapshot;
}

export async function writeTimelineCache(key: string, snapshot: Omit<TimelineCacheSnapshot, "savedAt">) {
  const value: TimelineCacheSnapshot = {
    ...snapshot,
    savedAt: Date.now(),
    entries: snapshot.entries.slice(0, 200).map(stripPhotoData),
  };
  memoryCache.set(key, value);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
  });
  db.close();
}

export function dropTimelineCache(key?: string) {
  if (key) memoryCache.delete(key);
  if (!canUseIndexedDb()) return;
  void openDb().then((db) => {
    if (!db) return;
    const transaction = db.transaction(STORE_NAME, "readwrite");
    if (key) transaction.objectStore(STORE_NAME).delete(key);
    else transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
}
