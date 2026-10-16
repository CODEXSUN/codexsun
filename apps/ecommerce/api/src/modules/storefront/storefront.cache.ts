import { getEcommerceTenantKey } from "../../database/ecommerce-database.js";

const cache = new Map<string, { expiresAt: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();

export async function readStorefrontCache<T>(
  key: string,
  loader: () => Promise<T>,
  ttlMs = 30_000
) {
  key = `${getEcommerceTenantKey()}:${key}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;
  const active = pending.get(key);
  if (active) return active as Promise<T>;
  const request = loader()
    .then((value) => {
      cache.set(key, { expiresAt: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

export function invalidateStorefrontReadCache() {
  cache.clear();
}
