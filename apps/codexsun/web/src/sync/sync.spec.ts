import assert from "node:assert/strict";
import { test } from "node:test";
import { CodexsunSyncEngine } from "./sync.engine";
import type {
  CodexsunCache,
  CodexsunDraft,
  CodexsunOutboxEntry,
  CodexsunSyncGateway,
  CodexsunSyncStorage
} from "./sync.types";

const scope = { tenantUuid: "tenant-a", actorEmail: "owner@example.test" };
const draft: CodexsunDraft = {
  clientKey: "stable-key-1",
  title: "Client portal",
  description: "Collect requirements",
  priority: "normal",
  origin: "desktop"
};

class TestStorage implements CodexsunSyncStorage {
  entries = new Map<string, CodexsunOutboxEntry>();
  cache: CodexsunCache = { records: [], syncedAt: null };
  failAcknowledgement = false;
  async list() {
    return [...this.entries.values()];
  }
  async put(entry: CodexsunOutboxEntry) {
    this.entries.set(entry.draft.clientKey, entry);
  }
  async acknowledge(key: string) {
    if (this.failAcknowledgement) {
      this.failAcknowledgement = false;
      throw new Error("Device restarted before acknowledgement");
    }
    this.entries.delete(key);
  }
  async readCache() {
    return this.cache;
  }
  async writeCache(cache: CodexsunCache) {
    this.cache = cache;
  }
  async deviceKey() {
    return "test-device";
  }
}

function backend(options: { context?: typeof scope; fail?: string; onPost?: () => void } = {}) {
  const created = new Map<string, unknown>();
  const posted: string[] = [];
  const gateway: CodexsunSyncGateway = {
    async get<T>(path: string): Promise<T> {
      if (options.fail) throw new Error(options.fail);
      return (path === "/codexsun/context" ? (options.context ?? scope) : { records: [] }) as T;
    },
    async post<T>(_path: string, body: unknown): Promise<T> {
      const content = body as CodexsunDraft;
      posted.push(content.clientKey);
      if (!created.has(content.clientKey)) created.set(content.clientKey, content);
      options.onPost?.();
      return created.get(content.clientKey) as T;
    }
  };
  return { gateway, created, posted };
}

test("restart after cloud success replays the same key without creating a second record", async () => {
  const storage = new TestStorage();
  const cloud = backend();
  const first = new CodexsunSyncEngine(scope, cloud.gateway, storage, () => true);
  await first.saveDraft(draft);
  storage.failAcknowledgement = true;
  await assert.rejects(first.sync(), /restarted/);
  assert.equal(storage.entries.size, 1);
  await new CodexsunSyncEngine(scope, cloud.gateway, storage, () => true).sync();
  assert.deepEqual(cloud.posted, [draft.clientKey, draft.clientKey]);
  assert.equal(cloud.created.size, 1);
  assert.equal(storage.entries.size, 0);
  assert.ok(storage.cache.syncedAt);
});

test("authentication failure retains pending drafts and never sends them", async () => {
  const storage = new TestStorage();
  const cloud = backend({ fail: "401 Session expired" });
  const engine = new CodexsunSyncEngine(scope, cloud.gateway, storage, () => true);
  await engine.saveDraft(draft);
  await assert.rejects(engine.sync(), /401/);
  assert.equal(cloud.posted.length, 0);
  assert.equal(storage.entries.size, 1);
});

test("different tenant or actor cannot receive this device's queued work", async () => {
  for (const context of [
    { ...scope, tenantUuid: "tenant-b" },
    { ...scope, actorEmail: "other@example.test" }
  ]) {
    const storage = new TestStorage();
    const cloud = backend({ context });
    const engine = new CodexsunSyncEngine(scope, cloud.gateway, storage, () => true);
    await engine.saveDraft(draft);
    await assert.rejects(engine.sync(), /Account changed/);
    assert.equal(cloud.posted.length, 0);
    assert.equal(storage.entries.size, 1);
  }
});

test("scope change during an in-flight submission stops the remaining queue", async () => {
  const storage = new TestStorage();
  let current = true;
  const cloud = backend({
    onPost: () => {
      current = false;
    }
  });
  const engine = new CodexsunSyncEngine(scope, cloud.gateway, storage, () => current);
  await engine.saveDraft(draft);
  await engine.saveDraft({ ...draft, clientKey: "stable-key-2" });
  await assert.rejects(engine.sync(), /Workspace changed/);
  assert.equal(cloud.posted.length, 1);
  assert.equal(storage.entries.size, 2);
});

test("concurrent retry requests share a single serialized cycle", async () => {
  const storage = new TestStorage();
  const cloud = backend();
  const engine = new CodexsunSyncEngine(scope, cloud.gateway, storage, () => true);
  await engine.saveDraft(draft);
  await Promise.all([engine.sync(), engine.sync(), engine.sync()]);
  assert.deepEqual(cloud.posted, [draft.clientKey]);
});

test("queued content is immutable and extra fields never enter local storage", async () => {
  const storage = new TestStorage();
  const engine = new CodexsunSyncEngine(scope, backend().gateway, storage, () => true);
  await engine.saveDraft({ ...draft, secret: "must-not-persist" } as CodexsunDraft);
  assert.equal("secret" in (await storage.list())[0]!.draft, false);
  await assert.rejects(engine.saveDraft({ ...draft, title: "Changed" }), /already queued/);
  assert.equal((await storage.list())[0]!.draft.title, draft.title);
});
