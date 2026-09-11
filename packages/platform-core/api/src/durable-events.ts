/**
 * Contracts for at-least-once delivery through an application-owned durable store.
 * The Platform Core package does not select a database, broker, or worker host.
 */
export interface PlatformDurableEvent<TPayload = unknown> {
  correlationId?: string
  eventId: string
  eventType: string
  occurredAt: string
  payload: TPayload
  publisherId: string
  version: string
}

export type PlatformDurableEventDeliveryState = 'completed' | 'failed' | 'pending' | 'processing'

export interface PlatformDurableEventDelivery {
  attempts: number
  consumerId: string
  event: PlatformDurableEvent
  state: PlatformDurableEventDeliveryState
}

export interface PlatformDurableEventConsumer {
  consumerId: string
  eventTypes: readonly string[]
  handle(event: PlatformDurableEvent): Promise<void>
}

export interface PlatformDurableEventStore {
  claim(
    consumer: PlatformDurableEventConsumer,
    now: Date,
  ): Promise<PlatformDurableEventDelivery | undefined>
  complete(delivery: PlatformDurableEventDelivery, completedAt: Date): Promise<void>
  fail(
    delivery: PlatformDurableEventDelivery,
    failure: Error,
    nextAttemptAt: Date | undefined,
  ): Promise<void>
  recoverExpired(now: Date): Promise<void>
}

export interface PlatformDurableEventWriter<TTransaction> {
  append(transaction: TTransaction, event: PlatformDurableEvent): Promise<void>
}

export interface PlatformDurableEventModuleRuntime {
  forModule(moduleId: string): PlatformDurableEventModuleBinding
  start(): void
  stop(): Promise<void>
}

export interface PlatformDurableEventModuleBinding {
  append(transaction: unknown, event: PlatformDurableEvent): Promise<void>
  register(consumer: Omit<PlatformDurableEventConsumer, 'consumerId'>): void
}

export interface PlatformDurableEventDispatchResult {
  attempted: number
  completed: number
  failed: number
}

export interface PlatformDurableEventDispatcherOptions {
  clock?: () => Date
  maxAttempts?: number
  onTerminalFailure?: (delivery: PlatformDurableEventDelivery, failure: Error) => void
  retryDelay?: (attempt: number) => number
}

/**
 * Runs registered consumers against a durable store. Each consumer must make its
 * own domain mutation idempotent. The store records delivery state for recovery.
 */
export class PlatformDurableEventDispatcher {
  private readonly clock: () => Date
  private readonly maxAttempts: number
  private readonly onTerminalFailure?: (
    delivery: PlatformDurableEventDelivery,
    failure: Error,
  ) => void
  private readonly retryDelay: (attempt: number) => number

  constructor(
    private readonly store: PlatformDurableEventStore,
    options: PlatformDurableEventDispatcherOptions = {},
  ) {
    this.clock = options.clock ?? (() => new Date())
    this.maxAttempts = options.maxAttempts ?? 5
    this.onTerminalFailure = options.onTerminalFailure
    this.retryDelay =
      options.retryDelay ?? ((attempt) => Math.min(60_000, 1_000 * 2 ** (attempt - 1)))
    if (!Number.isInteger(this.maxAttempts) || this.maxAttempts < 1) {
      throw new Error('The durable event maximum attempt count must be a positive integer.')
    }
  }

  async dispatch(
    consumer: PlatformDurableEventConsumer,
    limit = 100,
  ): Promise<PlatformDurableEventDispatchResult> {
    if (!Number.isInteger(limit) || limit < 1)
      throw new Error('The durable event dispatch limit must be positive.')
    await this.store.recoverExpired(this.clock())
    const result: PlatformDurableEventDispatchResult = { attempted: 0, completed: 0, failed: 0 }

    for (let index = 0; index < limit; index += 1) {
      const delivery = await this.store.claim(consumer, this.clock())
      if (!delivery) return result
      result.attempted += 1

      try {
        await consumer.handle(delivery.event)
        await this.store.complete(delivery, this.clock())
        result.completed += 1
      } catch (error) {
        const failure = error instanceof Error ? error : new Error('Durable event consumer failed.')
        const nextAttemptAt =
          delivery.attempts >= this.maxAttempts
            ? undefined
            : new Date(this.clock().getTime() + this.retryDelay(delivery.attempts))
        await this.store.fail(delivery, failure, nextAttemptAt)
        if (!nextAttemptAt) this.onTerminalFailure?.(delivery, failure)
        result.failed += 1
      }
    }
    return result
  }
}

/**
 * Binds consumer registration to manifest-declared event consumption. The
 * application owns its store and calls start only after module composition.
 */
export class PlatformDurableEventRegistry implements PlatformDurableEventModuleRuntime {
  private readonly consumers = new Map<string, PlatformDurableEventConsumer>()
  private readonly dispatcher: PlatformDurableEventDispatcher
  private timer: ReturnType<typeof setInterval> | undefined

  constructor(
    modules: readonly FrameworkModule[],
    private readonly store: PlatformDurableEventStore & PlatformDurableEventWriter<unknown>,
    private readonly intervalMilliseconds = 1_000,
    dispatcherOptions: PlatformDurableEventDispatcherOptions = {},
  ) {
    this.modules = new Map(modules.map((module) => [module.id, module]))
    this.dispatcher = new PlatformDurableEventDispatcher(store, dispatcherOptions)
    if (!Number.isInteger(intervalMilliseconds) || intervalMilliseconds < 1) {
      throw new Error('The durable event interval must be a positive integer.')
    }
  }

  private readonly modules: ReadonlyMap<string, FrameworkModule>

  forModule(moduleId: string): PlatformDurableEventModuleBinding {
    const module = this.modules.get(moduleId)
    if (!module) throw new Error(`Module "${moduleId}" is not in the composition plan.`)
    return {
      append: (transaction, event) => this.store.append(transaction, event),
      register: (consumer) => {
        if (this.consumers.has(moduleId)) {
          throw new Error(`Module "${moduleId}" already has a durable event consumer.`)
        }
        for (const eventType of consumer.eventTypes) {
          if (!module.consumes.some(({ id }) => id === eventType)) {
            throw new Error(`Module "${moduleId}" cannot consume undeclared event "${eventType}".`)
          }
        }
        this.consumers.set(moduleId, { ...consumer, consumerId: moduleId })
      },
    }
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      void this.dispatchAll()
    }, this.intervalMilliseconds)
  }

  async stop(): Promise<void> {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = undefined
  }

  private async dispatchAll(): Promise<void> {
    for (const consumer of this.consumers.values()) await this.dispatcher.dispatch(consumer)
  }
}

import type { FrameworkModule } from '@codexsun/framework'
