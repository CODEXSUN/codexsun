export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface SessionStore<TSession = Readonly<Record<string, unknown>>> {
  get(id: string): Promise<TSession | undefined>;
  put(id: string, session: TSession, expiresAt: string): Promise<void>;
  delete(id: string): Promise<void>;
}
