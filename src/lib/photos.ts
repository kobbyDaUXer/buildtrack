/**
 * Site photos live in IndexedDB, not localStorage — a handful of phone photos
 * would blow the ~5MB string quota instantly. Everything is downscaled on the
 * way in so a 4MB camera JPEG lands at roughly 200KB.
 */

const DB_NAME = "buildtrack-photos";
const STORE = "photos";
const MAX_EDGE = 1600;
const QUALITY = 0.82;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

async function downscale(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", QUALITY),
    );
  } catch {
    // HEIC or anything the browser cannot decode — store the original.
    return file;
  }
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function savePhoto(file: File): Promise<string> {
  const blob = await downscale(file);
  const id = newId();
  await run("readwrite", (s) => s.put(blob, id));
  return id;
}

export async function loadPhoto(id: string): Promise<Blob | null> {
  try {
    const blob = await run<Blob | undefined>("readonly", (s) => s.get(id));
    return blob ?? null;
  } catch {
    return null;
  }
}

export async function deletePhotos(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => run("readwrite", (s) => s.delete(id)).catch(() => undefined)),
  );
}

export async function photoStats(): Promise<{ count: number; bytes: number }> {
  try {
    const db = await open();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).openCursor();
      let count = 0;
      let bytes = 0;
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const value = cursor.value as Blob;
          count += 1;
          bytes += value?.size ?? 0;
          cursor.continue();
        } else {
          db.close();
          resolve({ count, bytes });
        }
      };
      req.onerror = () => {
        db.close();
        resolve({ count, bytes });
      };
    });
  } catch {
    return { count: 0, bytes: 0 };
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
