import type { FrameworkModule } from '@codexsun/framework'
import type { FastifyPluginAsync } from 'fastify'
import type { PlatformDiagnostics } from './diagnostics.js'
import type { PlatformDurableEventModuleBinding } from './durable-events.js'
import type { PlatformModuleEventBus } from './events.js'
import type {
  PlatformModuleMigration,
  PlatformModuleSchema,
  PlatformModuleSeed,
} from './module-data.js'
import type { PlatformRequestContextAccessor } from './request-context.js'
import type { PlatformReadinessProbe, PlatformReadinessRegistrar } from './readiness.js'
import type { PlatformAuthorizer } from './authorization.js'

export * from './authorization.js'
export * from './configuration.js'
export * from './diagnostics.js'
export * from './durable-events.js'
export * from './api-observability.js'
export * from './events.js'
export * from './environment.js'
export * from './logging.js'
export * from './module-data.js'
export * from './request-context.js'
export * from './readiness.js'
export * from './telemetry.js'

export interface PlatformModuleSummary {
  capabilities: readonly string[]
  consumes: readonly { id: string; versionRange: string }[]
  extensionPoints: readonly { cardinality: 'many' | 'one'; id: string; version: string }[]
  id: string
  kind: FrameworkModule['kind']
  owner: string
  publicContracts: readonly { id: string; version: string }[]
  publishes: readonly { id: string; version: string }[]
  version: string
}

export interface PlatformShutdownTask {
  close(): Promise<void> | void
  name: string
}

export interface PlatformApiModuleContext {
  authorization: PlatformAuthorizer
  clock: () => Date
  createId: () => string
  diagnostics: PlatformDiagnostics
  durableEvents: PlatformDurableEventModuleBinding
  events: PlatformModuleEventBus
  modules: readonly PlatformModuleSummary[]
  readiness: PlatformReadinessRegistrar
  requestContext: PlatformRequestContextAccessor
  registerShutdown(task: PlatformShutdownTask): void
  signal: AbortSignal
}

export interface PlatformApiModule<TMigrationContext = never, TSeedContext = TMigrationContext> {
  createPlugin(context: PlatformApiModuleContext): FastifyPluginAsync
  manifest: FrameworkModule
  migrations?: readonly PlatformModuleMigration<TMigrationContext>[]
  readiness?: readonly PlatformReadinessProbe[]
  schema?: PlatformModuleSchema<TMigrationContext>
  seeds?: readonly PlatformModuleSeed<TSeedContext>[]
}

export class PlatformShutdownRegistry {
  private closed = false
  private readonly tasks: PlatformShutdownTask[] = []

  register(task: PlatformShutdownTask): void {
    if (this.closed) throw new Error('The shutdown registry is already closed.')
    if (this.tasks.some(({ name }) => name === task.name)) {
      throw new Error(`The shutdown task "${task.name}" is already registered.`)
    }
    this.tasks.push(task)
  }

  async closeAll(): Promise<void> {
    if (this.closed) return
    this.closed = true

    const failures: Error[] = []
    for (const task of [...this.tasks].reverse()) {
      try {
        await task.close()
      } catch (error) {
        failures.push(error instanceof Error ? error : new Error(String(error)))
      }
    }
    if (failures.length > 0) throw new AggregateError(failures, 'Platform shutdown failed.')
  }
}
