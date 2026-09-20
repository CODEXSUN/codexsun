import type { EventDispatcher, FrameworkEvent } from "@codexsun/framework";
import type { OutboxMessage } from "./database-outbox.js";
import { DatabaseOutbox } from "./database-outbox.js";

/** Delivers persisted events to declared consumers and records completed deliveries. */
export class DatabaseOutboxEventDispatcher {
  constructor(
    private readonly outbox: DatabaseOutbox,
    private readonly dispatcher: EventDispatcher,
  ) {}

  async dispatch(message: OutboxMessage, completedAt = new Date().toISOString()): Promise<void> {
    await this.dispatcher.dispatch(toFrameworkEvent(message), {
      deliver: async ({ consumerId, event, handler }) => {
        if (await this.outbox.hasConsumed(consumerId, message.id)) return;
        await handler(event);
        await this.outbox.consumeOnce(consumerId, message.id, completedAt);
      },
    });
  }
}

function toFrameworkEvent(message: OutboxMessage): FrameworkEvent {
  return {
    correlationId: message.correlationId,
    id: message.id,
    name: message.eventType,
    payload: parsePayload(message),
    publisherId: message.owner,
    occurredAt: message.availableAt,
  };
}

function parsePayload(message: OutboxMessage): unknown {
  try {
    return JSON.parse(message.payload) as unknown;
  } catch (error) {
    throw new Error(`Outbox event payload is invalid JSON: ${message.id}`, { cause: error });
  }
}
