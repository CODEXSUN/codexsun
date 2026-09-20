import { randomUUID } from "node:crypto";

export interface FrameworkEvent<T = unknown> {
  readonly correlationId?: string;
  readonly id: string;
  readonly name: string;
  readonly payload: T;
  readonly publisherId: string;
  readonly occurredAt: string;
}

export type EventHandler<T = unknown> = (event: FrameworkEvent<T>) => void | Promise<void>;

export interface EventPublishOptions {
  readonly correlationId?: string;
  readonly occurredAt?: string;
}

export interface EventDelivery {
  readonly consumerId: string;
  readonly event: FrameworkEvent;
  readonly handler: EventHandler;
}

export interface EventDispatchOptions {
  readonly deliver?: (delivery: EventDelivery) => void | Promise<void>;
}

export interface EventDispatcher {
  dispatch(event: FrameworkEvent, options?: EventDispatchOptions): Promise<void>;
}

interface Subscription {
  readonly providerId: string;
  readonly handler: EventHandler;
}

export class EventBus implements EventDispatcher {
  private readonly subscriptions = new Map<string, Subscription[]>();

  subscribe(providerId: string, consumedEvents: readonly string[], name: string, handler: EventHandler): void {
    if (!consumedEvents.includes(name)) throw new Error(`Provider ${providerId} did not declare consumed event: ${name}`);
    const subscriptions = this.subscriptions.get(name) ?? [];
    subscriptions.push({ providerId, handler: handler as EventHandler });
    this.subscriptions.set(name, subscriptions);
  }

  async publish<T>(
    providerId: string,
    publishedEvents: readonly string[],
    name: string,
    payload: T,
    options: EventPublishOptions = {},
  ): Promise<void> {
    if (!publishedEvents.includes(name)) throw new Error(`Provider ${providerId} did not declare published event: ${name}`);
    const event: FrameworkEvent<T> = Object.freeze({
      correlationId: options.correlationId,
      id: randomUUID(),
      name,
      payload,
      publisherId: providerId,
      occurredAt: options.occurredAt ?? new Date().toISOString(),
    });
    await this.dispatch(event);
  }

  async dispatch(event: FrameworkEvent, options: EventDispatchOptions = {}): Promise<void> {
    for (const subscription of this.subscriptions.get(event.name) ?? []) {
      const delivery: EventDelivery = { consumerId: subscription.providerId, event, handler: subscription.handler };
      if (options.deliver) await options.deliver(delivery);
      else await subscription.handler(event);
    }
  }
}
