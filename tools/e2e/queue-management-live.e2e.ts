import assert from "node:assert/strict";
import Fastify from "fastify";
import { closePlatformDatabase } from "../../apps/platform/api/src/database/platform-database.js";
import { env } from "../../apps/platform/api/src/env.js";
import { closeBullMq } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.bullmq.js";
import {
  isQueueWorkerHealthy,
  startQueueManagerWorker
} from "../../apps/platform/api/src/modules/queue-manager/queue-manager.runtime.js";
import { QueueManagerService } from "../../apps/platform/api/src/modules/queue-manager/queue-manager.service.js";

const service = new QueueManagerService();
const originalBackend = await service.currentBackend();
const originalWorkerEnabled = env.CODEXSUN_QUEUE_WORKER_ENABLED;
const actorEmail = "queue-live-test@codexsun.app";
const results: Record<string, string> = {};
const app = Fastify({ logger: false });

try {
  const existingPending = await service.listJobs({ status: "pending" });
  assert.equal(
    existingPending.length,
    0,
    "Queue live test refuses to run while unrelated pending jobs exist."
  );

  await service.switchBackend("database", actorEmail);
  env.CODEXSUN_QUEUE_WORKER_ENABLED = "1";
  startQueueManagerWorker(app, service);
  assert.equal(isQueueWorkerHealthy(), true, "Queue worker did not start.");

  await verifyInlineBackend("database");
  await verifyClientArtifactQueue();

  try {
    await service.switchBackend("bullmq-redis", actorEmail);
    const job = await enqueueProbe("bullmq-redis");
    const completed = await waitForCompletion(job.id, 15_000);
    assert.equal(completed.status, "completed");
    assert.equal(completed.result.echo?.backend, "bullmq-redis");
    assert.equal(isQueueWorkerHealthy(), true, "Queue worker failed while using Redis.");
    results["bullmq-redis"] = "delivered";
  } catch (error) {
    results["bullmq-redis"] = `unavailable: ${errorMessage(error)}`;
    if (process.env.CODEXSUN_QUEUE_LIVE_REQUIRE_REDIS === "1") throw error;
  }

  console.log("Queue backend live verification passed", results);
} finally {
  await app.close();
  env.CODEXSUN_QUEUE_WORKER_ENABLED = originalWorkerEnabled;
  await closeBullMq().catch(() => undefined);
  await service.switchBackend(originalBackend, actorEmail).catch((error) => {
    console.error("Failed to restore queue backend", error);
    process.exitCode = 1;
  });
  await closePlatformDatabase();
}

async function verifyInlineBackend(backend: "database") {
  await service.switchBackend(backend, actorEmail);
  const job = await enqueueProbe(backend);
  assert.ok(job, `${backend} did not persist the probe job.`);
  const completed = await waitForCompletion(job.id, 15_000);
  assert.equal(completed.status, "completed");
  assert.equal(completed.result.echo?.backend, backend);
  assert.equal(isQueueWorkerHealthy(), true, "Queue worker failed while using the database.");
  results[backend] = "delivered";
}

async function enqueueProbe(backend: "bullmq-redis" | "database") {
  const job = await service.enqueue({
    correlationId: `queue-live:${backend}:${Date.now()}`,
    idempotencyKey: `queue-live:${backend}:${Date.now()}`,
    jobName: "queue.probe",
    maxAttempts: 2,
    payload: { backend },
    queueName: "system",
    sourceModule: "platform.queue-manager"
  });
  assert.ok(job, `${backend} did not return a persisted queue job.`);
  return job;
}

async function verifyClientArtifactQueue() {
  const queued = await service.enqueueClientArtifact(
    {
      artifactType: "pdf",
      category: "billing-sales",
      fileName: "queue-live-invoice.pdf",
      label: "Queue live invoice",
      sha256: "a".repeat(64),
      sizeBytes: 1024
    },
    { actorEmail, tenantId: "queue-live-tenant" },
    `queue-live:artifact:${Date.now()}`
  );
  assert.equal(queued.status, "pending");
  const completed = await waitForCompletion(queued.jobId, 15_000);
  assert.equal(completed.status, "completed");
  assert.equal(completed.jobName, "client-artifact.prepare");
  assert.equal(completed.queueName, "reports");
  assert.equal(completed.result.fileName, "queue-live-invoice.pdf");
  results["client-artifact"] = "delivered";
}

async function waitForCompletion(id: number, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const job = await service.findJob(id);
    if (job?.status === "completed") return job;
    if (job?.status === "failed") throw new Error(job.errorMessage ?? "Queue probe failed.");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Queue probe timed out before database metadata reached completed.");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
