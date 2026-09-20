import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { createSqliteDataProvider } from "../src/sqlite-data-provider.js";
import { DatabaseCacheStore, DatabaseSessionStore, sessionCacheMigration, type SessionCacheDatabase } from "../src/database-session-cache.js";
import { FileCacheStore, FileSessionStore } from "../src/file-session-cache.js";
import { sessionCookieOptions } from "../src/session-cookie.js";

test("file cache and sessions stay isolated by scope", async () => {
  const root = mkdtempSync(resolve(tmpdir(), "codexsun-session-cache-"));
  try {
    const first = new FileCacheStore(root, "first-app");
    const second = new FileCacheStore(root, "second-app");
    await first.set("shared", { value: 1 });
    assert.deepEqual(await first.get("shared"), { value: 1 });
    assert.equal(await second.get("shared"), undefined);

    const sessions = new FileSessionStore<{ actorId: string }>(root, "first-app");
    await sessions.put("session-1", { actorId: "actor-1" }, new Date(Date.now() + 60_000).toISOString());
    assert.deepEqual(await sessions.get("session-1"), { actorId: "actor-1" });
    await sessions.delete("session-1");
    assert.equal(await sessions.get("session-1"), undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("database cache and sessions use the shared migration and scope", async () => {
  const provider = createSqliteDataProvider<SessionCacheDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await sessionCacheMigration.apply(database);
  const cache = new DatabaseCacheStore(database, "first-app");
  const sessions = new DatabaseSessionStore<{ actorId: string }>(database, "first-app");

  await cache.set("key", { value: 2 });
  assert.deepEqual(await cache.get("key"), { value: 2 });
  await sessions.put("session-2", { actorId: "actor-2" }, new Date(Date.now() + 60_000).toISOString());
  assert.deepEqual(await sessions.get("session-2"), { actorId: "actor-2" });
  assert.equal(await new DatabaseCacheStore(database, "second-app").get("key"), undefined);
  await provider.destroy();
});

test("session cookie defaults are secure in production and HTTP-only", () => {
  assert.deepEqual(sessionCookieOptions({ appMode: "production" }), {
    name: "codexsun_session",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAgeSeconds: 900,
  });
  assert.throws(() => sessionCookieOptions({ appMode: "development", sameSite: "none" }), /HTTPS/u);
});
