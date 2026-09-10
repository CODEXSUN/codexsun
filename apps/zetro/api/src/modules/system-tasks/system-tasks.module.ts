import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import { BullSystemTaskQueue, LocalSystemTaskQueue } from './system-tasks.queue.js'
import { SystemTaskRepository } from './system-tasks.repository.js'
import { registerSystemTaskRoutes } from './system-tasks.routes.js'
import { SystemTaskService } from './system-tasks.service.js'

export const systemTasksModuleManifest = {
  capabilities: [
    'durable-system-tasks',
    'task-stop',
    'task-retry',
    'execution-history',
    'forced-termination-recovery',
    'local-queue',
    'bullmq-queue',
  ],
  dataSchema: { checksum: 'system-tasks-001-tasks-steps-v1', version: 1 },
  dependencies: {},
  id: 'zetro.system-tasks.api',
  lifecycle: {
    activate: 'Recover interrupted tasks and start the configured queue worker.',
    deactivate: 'Abort local work and close queue connections.',
    install: 'Create system task and execution history tables.',
    uninstall: 'Preserve task and execution history.',
    upgrade: 'Apply additive module-owned migrations before queue startup.',
  },
  publicContracts: ['SystemTaskService', '/api/v1/system-tasks/*'],
  scope: 'zetro-api',
  version: '1.1.0',
} as const

export async function registerSystemTasksModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  database: ZetroDatabase,
): Promise<SystemTaskService> {
  const queue =
    environment.ZETRO_QUEUE_DRIVER === 'bullmq' && environment.REDIS_URL
      ? new BullSystemTaskQueue(environment.REDIS_URL)
      : new LocalSystemTaskQueue()
  const service = new SystemTaskService(new SystemTaskRepository(database), queue)
  await service.initialize()
  await registerSystemTaskRoutes(server, service)
  server.addHook('onClose', () => service.close())
  return service
}
