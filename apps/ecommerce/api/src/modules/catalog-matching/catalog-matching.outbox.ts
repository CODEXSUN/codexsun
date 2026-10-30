import type { FastifyInstance } from "fastify";
import { CatalogMatchingRepository } from "./catalog-matching.repository.js";
import { semanticCatalogMatchJobName } from "./catalog-matching.worker.js";

export type CatalogMatchQueuePort = (input: {
  correlationId: string;
  idempotencyKey: string;
  jobName: string;
  maxAttempts: number;
  payload: Record<string, unknown>;
  queueName: string;
  sourceModule: string;
}) => Promise<unknown>;

export class CatalogMatchingOutboxRelay {
  constructor(private readonly repository = new CatalogMatchingRepository()) {}

  async relayNext(enqueue: CatalogMatchQueuePort) {
    const event = await this.repository.nextPendingEvent();
    if (!event) return null;
    try {
      await enqueue({
        correlationId: event.correlationId,
        idempotencyKey: `ecommerce-outbox:${event.id}`,
        jobName: semanticCatalogMatchJobName,
        maxAttempts: 5,
        payload: event.payload,
        queueName: "ecommerce",
        sourceModule: "ecommerce.catalog.matching"
      });
      await this.repository.markEventPublished(event.id);
      return event.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Outbox delivery failed.";
      await this.repository.markEventFailed(event.id, event.attempts, message);
      throw error;
    }
  }
}

export function startCatalogMatchingOutboxRelay(
  app: FastifyInstance,
  enqueue: CatalogMatchQueuePort,
  intervalMs = 1_000
) {
  const relay = new CatalogMatchingOutboxRelay();
  let running = false;
  const timer = setInterval(() => {
    if (running) return;
    running = true;
    void relay
      .relayNext(enqueue)
      .catch((error) => app.log.error({ error }, "catalog matching outbox relay failed"))
      .finally(() => {
        running = false;
      });
  }, intervalMs);
  timer.unref();
  app.addHook("onClose", async () => clearInterval(timer));
}
