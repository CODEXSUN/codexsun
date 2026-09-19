export interface FrameworkEvent<T = unknown> {
  readonly correlationId?: string;
  readonly name: string;
  readonly payload: T;
  readonly publisherId: string;
  readonly occurredAt: string;
}

export type EventHandler<T = unknown> = (event: FrameworkEvent<T>) => void | Promise<void>;

interface Subscription {
  readonly providerId: string;
  readonly handler: EventHandler;
}

export class EventBus {
  private readonly subscriptions = new Map<string, Subscription[]>();

  subscribe(providerId: string, consumedEvents: readonly string[], name: string, handler: EventHandler): void {
    if (!consumedEvents.includes(name)) throw new Error(`Provider ${providerId} did not declare consumed event: ${name}`);
    const subscriptions = this.subscriptions.get(name) ?? [];
    subscriptions.push({ providerId, handler: handler as EventHandler });
    this.subscriptions.set(name, subscriptions);
  }

  async publish<T>(providerId: string, publishedEvents: readonly string[], name: string, payload: T): Promise<void> {
    if (!publishedEvents.includes(name)) throw new Error(`Provider ${providerId} did not declare published event: ${name}`);
    const event: FrameworkEvent<T> = Object.freeze({ name, payload, publisherId: providerId, occurredAt: new Date().toISOString() });
    for (const subscription of this.subscriptions.get(name) ?? []) await subscription.handler(event);
  }
}
