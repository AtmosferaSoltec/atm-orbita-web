// Object storage for attached files. The mockup keeps the bytes in the browser (IndexedDB, since
// localStorage is too small for PDFs). With the API, this becomes Cloudflare R2: the API hands out
// signed upload/download URLs for these same keys, and the browser never holds R2 credentials.

export interface DocumentStorage {
	put(key: string, blob: Blob): Promise<void>;
	get(key: string): Promise<Blob | null>;
	remove(key: string): Promise<void>;
	clear(): Promise<void>;
}

const DB_NAME = 'orbita-documents';
const STORE = 'objects';

function request<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

class IndexedDbStorage implements DocumentStorage {
	#db: Promise<IDBDatabase> | null = null;

	#open(): Promise<IDBDatabase> {
		this.#db ??= new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, 1);
			req.onupgradeneeded = () => req.result.createObjectStore(STORE);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		return this.#db;
	}

	async #store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
		return (await this.#open()).transaction(STORE, mode).objectStore(STORE);
	}

	async put(key: string, blob: Blob): Promise<void> {
		await request((await this.#store('readwrite')).put(blob, key));
	}

	async get(key: string): Promise<Blob | null> {
		return ((await request((await this.#store('readonly')).get(key))) as Blob | undefined) ?? null;
	}

	async remove(key: string): Promise<void> {
		await request((await this.#store('readwrite')).delete(key));
	}

	async clear(): Promise<void> {
		await request((await this.#store('readwrite')).clear());
	}
}

/** Used when IndexedDB is unavailable (some private windows): files last until the tab closes. */
class MemoryStorage implements DocumentStorage {
	#objects = new Map<string, Blob>();

	async put(key: string, blob: Blob): Promise<void> {
		this.#objects.set(key, blob);
	}

	async get(key: string): Promise<Blob | null> {
		return this.#objects.get(key) ?? null;
	}

	async remove(key: string): Promise<void> {
		this.#objects.delete(key);
	}

	async clear(): Promise<void> {
		this.#objects.clear();
	}
}

/** Tries IndexedDB first and switches to memory for good if it fails. */
class FallbackStorage implements DocumentStorage {
	#primary: DocumentStorage | null = globalThis.indexedDB ? new IndexedDbStorage() : null;
	#memory = new MemoryStorage();

	async #run<T>(action: (storage: DocumentStorage) => Promise<T>): Promise<T> {
		if (this.#primary) {
			try {
				return await action(this.#primary);
			} catch {
				this.#primary = null;
			}
		}
		return action(this.#memory);
	}

	put(key: string, blob: Blob) {
		return this.#run((s) => s.put(key, blob));
	}

	get(key: string) {
		return this.#run((s) => s.get(key));
	}

	remove(key: string) {
		return this.#run((s) => s.remove(key));
	}

	clear() {
		return this.#run((s) => s.clear());
	}
}

export const documentStorage: DocumentStorage = new FallbackStorage();
