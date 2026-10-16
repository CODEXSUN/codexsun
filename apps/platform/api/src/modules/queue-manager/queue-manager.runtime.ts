import type { FastifyInstance } from "fastify";
import { env } from "../../env.js";
import { closeBullMq, startBullMqWorker } from "./queue-manager.bullmq.js";
import { QueueManagerService } from "./queue-manager.service.js";

let queueWorkerTimer: NodeJS.Timeout | null = null;
let queueWorkerFailed = false;

export function isQueueWorkerHealthy() {
  return (
    env.CODEXSUN_QUEUE_WORKER_ENABLED !== "1" || (queueWorkerTimer !== null && !queueWorkerFailed)
  );
}

export function startQueueManagerWorker(app: FastifyInstance, service = new QueueManagerService()) {
  if (env.CODEXSUN_QUEUE_WORKER_ENABLED !== "1" || queueWorkerTimer) {
    return;
  }
  let running = false;
  let cleanupTicks = 0;
  queueWorkerTimer = setInterval(() => {
    if (running) return;
    running = true;
    void service
      .currentBackend()
      .then(async (backend) => {
        if (backend === "bullmq-redis") {
          startBullMqWorker("chat", (queueJobId) =>
            service.runJob(queueJobId, { fromWorker: true })
          );
          startBullMqWorker("crm", (queueJobId) =>
            service.runJob(queueJobId, { fromWorker: true })
          );
          startBullMqWorker("maintenance", (queueJobId) =>
            service.runJob(queueJobId, { fromWorker: true })
          );
          startBullMqWorker("mail", (queueJobId) =>
            service.runJob(queueJobId, { fromWorker: true })
          );
          startBullMqWorker("reports", (queueJobId) =>
            service.runJob(queueJobId, { fromWorker: true })
          );
          startBullMqWorker("system", (queueJobId) =>
            service.runJob(queueJobId, { fromWorker: true })
          );
          return null;
        }
        await closeBullMq();
        return service.runNextJob();
      })
      .then(async () => {
        queueWorkerFailed = false;
        cleanupTicks += 1;
        if (cleanupTicks >= 120) {
          cleanupTicks = 0;
          await service.cleanupRetainedJobs();
        }
      })
      .catch((error) => {
        queueWorkerFailed = true;
        app.log.error({ error }, "queue worker failed");
      })
      .finally(() => {
        running = false;
      });
  }, env.CODEXSUN_QUEUE_WORKER_INTERVAL_MS);
  queueWorkerTimer.unref();
  app.addHook("onClose", async () => {
    if (queueWorkerTimer) {
      clearInterval(queueWorkerTimer);
      queueWorkerTimer = null;
      queueWorkerFailed = false;
    }
    await closeBullMq();
  });
}
