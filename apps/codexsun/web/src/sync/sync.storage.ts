import { codexsunScopeKey } from "./sync.types";
import { createCodexsunClientKey } from "./sync.identity";
import type {
  CodexsunCache,
  CodexsunDraft,
  CodexsunOutboxEntry,
  CodexsunSyncScope,
  CodexsunSyncStorage
} from "./sync.types";

// Store draft content only. Authentication and permissions always remain online.
export class CodexsunIndexedDbStorage implements CodexsunSyncStorage {
  private database: Promise<IDBDatabase> | null = null;

  constructor(private readonly scope: CodexsunSyncScope) {}

  close(): void {
    const database = this.database;
    this.database = null;
    if (database)
      void database.then(
        (db) => db.close(),
        () => undefined
      );
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise((resolve, reject) => {
      const request = indexedDB.open(`codexsun-agent-drafts:${codexsunScopeKey(this.scope)}`, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("outbox", { keyPath: "draft.clientKey" });
        request.result.createObjectStore("cache");
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => this.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error ?? new Error("Local draft storage unavailable"));
      request.onblocked = () =>
        reject(new Error("Close other workspace tabs to update local storage"));
    });
    return this.database;
  }

  list(): Promise<CodexsunOutboxEntry[]> {
    return this.transact("outbox", "readonly", (store) => store.getAll());
  }

  async put(entry: CodexsunOutboxEntry): Promise<void> {
    await this.transact("outbox", "readwrite", (store) => store.put(entry));
  }

  async acknowledge(clientKey: string): Promise<void> {
    await this.transact("outbox", "readwrite", (store) => store.delete(clientKey));
  }

  async readCache(): Promise<CodexsunCache> {
    return (
      (await this.transact<CodexsunCache | undefined>("cache", "readonly", (store) =>
        store.get("requirements")
      )) ?? { records: [], syncedAt: null }
    );
  }

  async writeCache(cache: CodexsunCache): Promise<void> {
    await this.transact("cache", "readwrite", (store) => store.put(cache, "requirements"));
  }

  async deviceKey(kind: CodexsunDraft["origin"]): Promise<string> {
    const db = await this.getDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("cache", "readwrite");
      const store = transaction.objectStore("cache");
      const cacheKey = `deviceKey:${kind}`;
      const request = store.get(cacheKey);
      let key = "";
      request.onsuccess = () => {
        key = typeof request.result === "string" ? request.result : createCodexsunClientKey();
        store.put(key, cacheKey);
      };
      transaction.oncomplete = () => resolve(key);
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Device identity could not be stored"));
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Device identity could not be stored"));
    });
  }

  private async transact<T>(
    name: string,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const db = await this.getDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(name, mode);
      const request = run(transaction.objectStore(name));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Local storage operation failed"));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Local storage operation cancelled"));
    });
  }
}
