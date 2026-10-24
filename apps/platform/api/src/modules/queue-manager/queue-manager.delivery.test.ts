import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { Queue, Worker } from "bullmq";
import { env } from "../../env.js";
import {
  closeBullMq,
  publishBullMqJob,
  queueRedisPrefix,
  startBullMqWorker
} from "./queue-manager.bullmq.js";
import {
  readQueueDelivery,
  redisQueuePrefix,
  verifyQueueDelivery
} from "./queue-manager.delivery.js";
import type { QueueJobRecord } from "./queue-manager.types.js";

test("Redis queues separate master databases and normalize host casing", () => {
  const database = { host: "DB", port: 3306, name: "codexsun_master_db" };
  const prefix = redisQueuePrefix(database);
  assert.equal(prefix, redisQueuePrefix({ ...database, host: "db" }));
  assert.notEqual(prefix, redisQueuePrefix({ ...database, name: "other_master_db" }));
  assert.notEqual(prefix, redisQueuePrefix({ ...database, port: 3307 }));
  assert.notEqual(prefix, "bull");
});

test("deliveries reject missing, forged, and reused numeric identities", () => {
  for (const data of [
    null,
    {},
    { queueJobId: 1 },
    { queueJobId: "1", queueJobUuid: "a" },
    { queueJobId: 0, queueJobUuid: "a" }
  ])
    assert.throws(() => readQueueDelivery(data));
  assert.deepEqual(readQueueDelivery({ queueJobId: 1, queueJobUuid: "new" }), {
    id: 1,
    uuid: "new"
  });
  assert.throws(() => verifyQueueDelivery("new", null));
  assert.throws(() => verifyQueueDelivery("new", { uuid: "old" }));
  verifyQueueDelivery("new", { uuid: "new" });
});

test(
  "real Redis delivery stays isolated from a legacy worker and duplicate publication",
  {
    skip: process.env.CODEXSUN_TEST_REDIS !== "1"
  },
  async () => {
    const url = new URL(env.CODEXSUN_REDIS_URL);
    const connection = {
      host: url.hostname,
      port: Number(url.port || 6379),
      db: Number(url.pathname.slice(1) || 0),
      password: url.password ? decodeURIComponent(url.password) : undefined,
      username: url.username || undefined,
      maxRetriesPerRequest: null
    };
    const name = `codexsun-delivery-test-${randomUUID()}`;
    const queue = new Queue(name, { connection, prefix: queueRedisPrefix });
    const legacyQueue = new Queue(name, { connection });
    let legacyCalls = 0,
      ownCalls = 0;
    const legacy = new Worker(
      name,
      async () => {
        legacyCalls++;
      },
      { connection }
    );
    const record: QueueJobRecord = {
      id: 1,
      uuid: randomUUID(),
      queueName: name,
      jobName: "queue.probe",
      attempts: 0,
      maxAttempts: 1,
      priority: 1,
      idempotencyKey: randomUUID(),
      payload: { queueJobId: 999, queueJobUuid: "forged" },
      actorEmail: "test@codexsun.local",
      availableAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      correlationId: null,
      errorMessage: null,
      result: {},
      sourceModule: "queue-manager.test",
      startedAt: null,
      status: "pending",
      tenantId: null
    };
    const own = startBullMqWorker(name, async (id, uuid) => {
      assert.equal(id, record.id);
      verifyQueueDelivery(uuid, record);
      ownCalls++;
      return { processed: true };
    })!;
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.all([own.waitUntilReady(), legacy.waitUntilReady()]);
      const completed = new Promise<void>((resolve, reject) => {
        own.once("completed", () => resolve());
        own.once("failed", (_job, error) => reject(error));
        timer = setTimeout(() => reject(new Error("Redis delivery timed out.")), 10000);
      });
      await publishBullMqJob(record);
      await completed;
      await publishBullMqJob(record);
      const jobs = await queue.getJobs(["completed", "waiting", "active"]);
      assert.equal(jobs.length, 1);
      assert.equal(await jobs[0]!.getState(), "completed");
      assert.equal(ownCalls, 1);
      assert.equal(legacyCalls, 0);
      assert.equal(await legacyQueue.count(), 0);
    } finally {
      if (timer) clearTimeout(timer);
      await closeBullMq();
      await legacy.close();
      await queue.obliterate({ force: true });
      await legacyQueue.obliterate({ force: true });
      await queue.close();
      await legacyQueue.close();
    }
  }
);
