import assert from "node:assert/strict";
import test from "node:test";
import {
  DatabaseOutbox,
  DatabaseOutboxEventDispatcher,
  DatabaseOutboxWorker,
  DatabaseJobQueue,
  DatabaseJobWorker,
  DatabaseNotificationStore,
  createSqliteDataProvider,
  type DatabaseOutboxSchema,
  type DatabaseJobQueueSchema,
  type DatabaseNotificationSchema,
  StorageProvider,
} from "@codexsun/platform-core";
import { EventBus } from "@codexsun/framework";
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

test("dispatches persisted events once for each declared consumer", async () => {
  const provider = createSqliteDataProvider<OperationsDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await operationsMigration.apply(database);
  const outbox = new DatabaseOutbox(database as unknown as Kysely<DatabaseOutboxSchema>);
  const bus = new EventBus();
  const received: string[] = [];
  bus.subscribe("platform.operations.audit", ["platform.operation-recorded.v1"], "platform.operation-recorded.v1", (event) => {
    received.push((event.payload as { id: string }).id);
  });
  const message = await outbox.record({
    owner: "platform.operations",
    eventType: "platform.operation-recorded.v1",
    payload: JSON.stringify({ id: "one" }),
    correlationId: "request-1",
    availableAt: "2026-09-17T00:00:00.000Z",
  });
  const dispatcher = new DatabaseOutboxEventDispatcher(outbox, bus);

  await dispatcher.dispatch(message, "2026-09-17T00:00:01.000Z");
  await dispatcher.dispatch(message, "2026-09-17T00:00:02.000Z");

  assert.deepEqual(received, ["one"]);
  assert.equal(await outbox.hasConsumed("platform.operations.audit", message.id), true);
  await provider.destroy();
});

test("runs, retries, cancels, and recovers database-backed jobs", async () => {
  const provider = createSqliteDataProvider<OperationsDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await operationsMigration.apply(database);
  const queue = new DatabaseJobQueue(database as unknown as Kysely<DatabaseJobQueueSchema>);
  const canceled = await queue.enqueue({
    owner: "platform.operations",
    name: "test.cancel.v1",
    payload: "{}",
    availableAt: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(await queue.cancel(canceled.id), true);
  assert.equal(await queue.cancel(canceled.id), false);

  const retry = await queue.enqueue({
    owner: "platform.operations",
    name: "test.retry.v1",
    payload: "{}",
    correlationId: "request-1",
    availableAt: "2026-09-17T00:00:00.000Z",
  });
  const failingWorker = new DatabaseJobWorker(queue, async () => Promise.reject(new Error("expected")), {
    maximumAttempts: 2,
    retryDelayMs: 1_000,
  });
  assert.equal(await failingWorker.runOnce(new Date("2026-09-17T00:00:00.000Z")), "retried");
  assert.equal(await failingWorker.runOnce(new Date("2026-09-17T00:00:01.000Z")), "failed");
  assert.ok(retry.id);

  const recovered = await queue.enqueue({
    owner: "platform.operations",
    name: "test.recover.v1",
    payload: "{}",
    availableAt: "2026-09-17T00:00:00.000Z",
  });
  assert.equal((await queue.claimNext("2026-09-17T00:00:00.000Z"))?.id, recovered.id);
  const completed: string[] = [];
  const worker = new DatabaseJobWorker(queue, async (job) => {
    completed.push(job.name);
  }, {
    lockTimeoutMs: 60_000,
    maximumAttempts: 1,
    retryDelayMs: 1,
  });
  assert.equal(await worker.runOnce(new Date("2026-09-17T00:02:00.000Z")), "completed");
  assert.deepEqual(completed, ["test.recover.v1"]);
  assert.deepEqual(await queue.stateCounts(), { canceled: 1, completed: 1, failed: 1, processing: 0, scheduled: 0 });
  await provider.destroy();
});

test("stores notifications with recipient isolation and idempotent event delivery", async () => {
  const provider = createSqliteDataProvider<OperationsDatabase>({ filename: ":memory:" });
  const database = provider.queryDatabase();
  await operationsMigration.apply(database);
  const store = new DatabaseNotificationStore(database as unknown as Kysely<DatabaseNotificationSchema>);
  const created = await store.create({
    recipientId: "actor-1",
    applicationId: "platform",
    title: "Job complete",
    description: "The platform job finished.",
    severity: "success",
    sourceEventId: "event-1",
    createdAt: "2026-09-17T00:00:00.000Z",
  });
  const duplicate = await store.create({
    recipientId: "actor-1",
    applicationId: "platform",
    title: "Duplicate ignored",
    severity: "info",
    sourceEventId: "event-1",
  });
  assert.equal(duplicate.id, created.id);
  assert.equal((await store.list("actor-2")).length, 0);
  assert.equal((await store.list("actor-1")).length, 1);
  assert.equal(await store.markRead("actor-1", created.id, "2026-09-17T00:01:00.000Z"), true);
  assert.equal((await store.list("actor-1")).length, 0);
  assert.equal((await store.list("actor-1", { includeRead: true }))[0]?.readAt, "2026-09-17T00:01:00.000Z");
  await store.create({ recipientId: "actor-1", applicationId: "platform", title: "One", severity: "info" });
  await store.create({ recipientId: "actor-1", applicationId: "other", title: "Two", severity: "info" });
  assert.equal(await store.markAllRead("actor-1", "platform", "2026-09-17T00:02:00.000Z"), 1);
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
