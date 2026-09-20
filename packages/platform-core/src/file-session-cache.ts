import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { CacheStore, SessionStore } from "@codexsun/framework";

type StoredValue = { readonly value: unknown; readonly expiresAt?: string };

export class FileCacheStore implements CacheStore {
  constructor(private readonly root: string, private readonly scope: string) {
    validateScope(scope);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const stored = await readStoredValue(this.fileFor(key));
    if (!stored || isExpired(stored.expiresAt)) {
      if (stored) await this.delete(key);
      return undefined;
    }
    return stored.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds === undefined ? undefined : expiration(ttlSeconds);
    const file = this.fileFor(key);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify({ value, expiresAt } satisfies StoredValue), "utf8");
  }

  async delete(key: string): Promise<void> {
    await rm(this.fileFor(key), { force: true });
  }

  private fileFor(key: string): string {
    return resolve(this.root, this.scope, `${validateKey(key)}.json`);
  }
}

export class FileSessionStore<TSession = Readonly<Record<string, unknown>>> implements SessionStore<TSession> {
  private readonly cache: FileCacheStore;

  constructor(root: string, scope: string) {
    this.cache = new FileCacheStore(root, scope);
  }

  get<T extends TSession>(id: string): Promise<T | undefined> {
    return this.cache.get<T>(id);
  }

  put(id: string, session: TSession, expiresAt: string): Promise<void> {
    const ttlSeconds = Math.max(1, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1_000));
    return this.cache.set(id, session, ttlSeconds);
  }

  delete(id: string): Promise<void> {
    return this.cache.delete(id);
  }
}

async function readStoredValue(file: string): Promise<StoredValue | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as StoredValue;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function expiration(ttlSeconds: number): string {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1) throw new Error("Cache TTL must be a positive integer.");
  return new Date(Date.now() + ttlSeconds * 1_000).toISOString();
}

function isExpired(expiresAt: string | undefined): boolean {
  return expiresAt !== undefined && Date.parse(expiresAt) <= Date.now();
}

function validateScope(scope: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(scope)) throw new Error("Session and cache scope must be lowercase kebab-case.");
  return scope;
}

function validateKey(key: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$/u.test(key)) throw new Error("Session and cache keys contain unsupported characters.");
  return key;
}
