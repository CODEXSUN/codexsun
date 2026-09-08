import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import { TaskRepository } from './tasks.repository.js'
import { registerTaskRoutes } from './tasks.routes.js'
import { TaskService } from './tasks.service.js'

export const tasksModuleManifest = {
  capabilities: ['task-create', 'task-list', 'task-update'],
  dependencies: {},
  id: 'zetro.tasks.api',
  lifecycle: {
    activate: 'Initialize the repository and register task routes.',
    deactivate: 'Stop accepting new task requests with the API runtime.',
    install: 'Create private task storage on first initialization.',
    uninstall: 'Preserve task storage for recoverability.',
    upgrade: 'No migration is required for version 0.1.0.',
  },
  publicContracts: ['GET /api/v1/tasks', 'POST /api/v1/tasks', 'PATCH /api/v1/tasks/:taskId'],
  scope: 'zetro-api',
  version: '0.1.0',
} as const

export async function registerTasksModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
) {
  const repository = new TaskRepository(
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'tasks.json'),
  )
  await repository.initialize()
  await registerTaskRoutes(server, new TaskService(repository))
}
