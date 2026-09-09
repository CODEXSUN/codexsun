import { AsyncLocalStorage } from 'node:async_hooks'
import type { PlatformActor } from './authorization.js'

export interface PlatformRequestContext {
  actor: PlatformActor
  correlationId: string
  locale?: string
  requestId: string
  signal: AbortSignal
}

export interface PlatformRequestContextAccessor {
  get(): PlatformRequestContext | undefined
  require(): PlatformRequestContext
}

export class PlatformRequestContextStore implements PlatformRequestContextAccessor {
  private readonly storage = new AsyncLocalStorage<PlatformRequestContext>()

  get(): PlatformRequestContext | undefined {
    return this.storage.getStore()
  }

  require(): PlatformRequestContext {
    const context = this.get()
    if (!context) throw new Error('A Platform request context is not active.')
    return context
  }

  run<T>(context: PlatformRequestContext, action: () => T): T {
    return this.storage.run(context, action)
  }
}
