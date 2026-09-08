export interface PlatformEvent<TPayload = unknown> {
  correlationId?: string
  id: string
  occurredAt: string
  payload: TPayload
  publisherId: string
  version: string
}

export type PlatformEventHandler = (event: PlatformEvent) => Promise<void> | void

export interface PlatformEventSubscription {
  unsubscribe(): void
}

export interface PlatformEventBus {
  publish(event: PlatformEvent): Promise<void>
  subscribe(eventId: string, handler: PlatformEventHandler): PlatformEventSubscription
}

export interface PlatformModuleEvent<TPayload = unknown> {
  correlationId?: string
  id: string
  payload: TPayload
  version: string
}

export interface PlatformModuleEventBus {
  publish(event: PlatformModuleEvent): Promise<void>
  subscribe(eventId: string, handler: PlatformEventHandler): PlatformEventSubscription
}

export class InMemoryPlatformEventBus implements PlatformEventBus {
  private readonly handlers = new Map<string, Set<PlatformEventHandler>>()

  async publish(event: PlatformEvent): Promise<void> {
    const handlers = [...(this.handlers.get(event.id) ?? [])]
    const failures = await Promise.allSettled(
      handlers.map((handler) => Promise.resolve().then(() => handler(event))),
    )
    const errors = failures
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(({ reason }) => reason)
    if (errors.length > 0) throw new AggregateError(errors, `Event "${event.id}" failed.`)
  }

  subscribe(eventId: string, handler: PlatformEventHandler): PlatformEventSubscription {
    const handlers = this.handlers.get(eventId) ?? new Set<PlatformEventHandler>()
    handlers.add(handler)
    this.handlers.set(eventId, handlers)

    return {
      unsubscribe: () => {
        handlers.delete(handler)
        if (handlers.size === 0) this.handlers.delete(eventId)
      },
    }
  }
}

export class DeclaredPlatformEventBus {
  private readonly modules: ReadonlyMap<string, FrameworkModule>

  constructor(
    modules: readonly FrameworkModule[],
    private readonly bus: PlatformEventBus = new InMemoryPlatformEventBus(),
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.modules = new Map(modules.map((module) => [module.id, module]))
  }

  forModule(moduleId: string): PlatformModuleEventBus {
    const module = this.modules.get(moduleId)
    if (!module) throw new Error(`Module "${moduleId}" is not in the composition plan.`)

    return {
      publish: async (event) => {
        const declaration = module.publishes.find(({ id }) => id === event.id)
        if (!declaration || declaration.version !== event.version) {
          throw new Error(`Module "${moduleId}" cannot publish undeclared event "${event.id}".`)
        }
        await this.bus.publish({
          ...event,
          occurredAt: this.clock().toISOString(),
          publisherId: moduleId,
        })
      },
      subscribe: (eventId, handler) => {
        if (!module.consumes.some(({ id }) => id === eventId)) {
          throw new Error(`Module "${moduleId}" cannot consume undeclared event "${eventId}".`)
        }
        return this.bus.subscribe(eventId, handler)
      },
    }
  }
}
import type { FrameworkModule } from '@codexsun/framework'
