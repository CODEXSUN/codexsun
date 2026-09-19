import assert from "node:assert/strict";
import test from "node:test";
import {
  DatabaseOutbox,
  DatabaseOutboxWorker,
  createSqliteDataProvider,
  type DatabaseOutboxSchema,
  StorageProvider,
} from "@codexsun/platform-core";
import type { Kysely } from "kysely";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { operationsMigration } from "../migrations/operations.migration.js";
import type { OperationsDatabase } from "../operations.database.js";
import { OperationsService } from "../service/operations.service.js";

test("records, claims, retries, and completes database-backed outbox work", async () => {
  const provider = createSqliteDataProvider<OperationsDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await operationsMigration.apply(database);
  const outbox = new DatabaseOutbox(database as unknown as Kysely<DatabaseOutboxSchema>);
  const message = await outbox.record({
    owner: "platform.operations",
    eventType: "platform.operation-recorded.v1",
    payload: "{}",
    availableAt: "2026-09-17T00:00:00.000Z",
  });

  const claimed = await outbox.claimNext("2026-09-17T00:00:00.000Z");
  assert.equal(claimed?.id, message.id);
  await outbox.fail(message.id, "2026-09-17T00:01:00.000Z", "delivery.failed", 2);
  assert.equal(await outbox.claimNext("2026-09-17T00:00:30.000Z"), undefined);
  assert.equal((await outbox.claimNext("2026-09-17T00:01:00.000Z"))?.attempts, 1);
  await outbox.complete(message.id, "2026-09-17T00:01:01.000Z");
  assert.equal(await outbox.consumeOnce("platform.operations.audit", message.id, "2026-09-17T00:01:02.000Z"), true);
  assert.equal(await outbox.consumeOnce("platform.operations.audit", message.id, "2026-09-17T00:01:03.000Z"), false);
  assert.deepEqual(await outbox.stateCounts(), { pending: 0, processing: 0, completed: 1, failed: 0 });
  await provider.destroy();
});

test("marks database work as failed after its retry limit", async () => {
  const provider = createSqliteDataProvider<OperationsDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await operationsMigration.apply(database);
  const outbox = new DatabaseOutbox(database as unknown as Kysely<DatabaseOutboxSchema>);
  await outbox.record({
    owner: "platform.operations",
    eventType: "test.failed.v1",
    payload: "{}",
    availableAt: "2026-09-17T00:00:00.000Z",
  });
  const worker = new DatabaseOutboxWorker(outbox, async () => Promise.reject(new Error("expected")), {
    maximumAttempts: 1,
    retryDelayMs: 1000,
  });

  assert.equal(await worker.runOnce(new Date("2026-09-17T00:00:00.000Z")), "failed");
  assert.deepEqual(await outbox.stateCounts(), { pending: 0, processing: 0, completed: 0, failed: 1 });
  await provider.destroy();
});

test("releases work abandoned by a crashed outbox worker", async () => {
  const provider = createSqliteDataProvider<OperationsDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await operationsMigration.apply(database);
  const outbox = new DatabaseOutbox(database as unknown as Kysely<DatabaseOutboxSchema>);
  await outbox.record({
    owner: "platform.operations",
    eventType: "test.recovered.v1",
    payload: "{}",
    availableAt: "2026-09-17T00:00:00.000Z",
  });
  assert.ok(await outbox.claimNext("2026-09-17T00:00:00.000Z"));
  const worker = new DatabaseOutboxWorker(outbox, async () => undefined, {
    lockTimeoutMs: 60_000,
    maximumAttempts: 2,
    retryDelayMs: 1,
  });

  assert.equal(await worker.runOnce(new Date("2026-09-17T00:02:00.000Z")), "completed");
  assert.deepEqual(await outbox.stateCounts(), { pending: 0, processing: 0, completed: 1, failed: 0 });
  await provider.destroy();
});

test("isolates module storage and validates structured audit records", async () => {
  const root = await mkdtemp(join(tmpdir(), "codexsun-storage-"));
  const service = new OperationsService(new StorageProvider(root));
  const storage = service.storageFor("operations");
  await storage.write("private", "evidence/check.txt", "ready");
  assert.equal((await storage.read("private", "evidence/check.txt")).toString(), "ready");
  assert.throws(() => storage.pathFor("private", "../../escape.txt"));
  assert.equal(
    service.audit({
      application: "platform",
      module: "operations",
      correlationId: "test-correlation",
      event: "operations.storage.checked",
      outcome: "success",
      occurredAt: "2026-09-17T00:00:00.000Z",
    }).module,
    "operations",
  );
});
