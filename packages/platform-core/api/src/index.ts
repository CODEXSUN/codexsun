import type { FrameworkModule } from '@codexsun/framework'
import type { FastifyPluginAsync } from 'fastify'

export interface PlatformModuleSummary {
  capabilities: readonly string[]
  id: string
  version: string
}

export interface PlatformShutdownTask {
  close(): Promise<void> | void
  name: string
}

export interface PlatformApiModuleContext {
  clock: () => Date
  createId: () => string
  modules: readonly PlatformModuleSummary[]
  registerShutdown(task: PlatformShutdownTask): void
  signal: AbortSignal
}

export interface PlatformApiModule {
  createPlugin(context: PlatformApiModuleContext): FastifyPluginAsync
  manifest: FrameworkModule
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
