import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import { TaskRepository } from './tasks.repository.js'
import { registerTaskRoutes } from './tasks.routes.js'
import { TaskService } from './tasks.service.js'
import { defaultProjectId, type ProjectService } from '../projects/index.js'

export const tasksModuleManifest = {
  capabilities: ['task-create', 'task-list', 'task-update', 'task-archive', 'task-pin'],
  dataSchema: { checksum: 'tasks-001-tasks-v1', version: 1 },
  dependencies: { 'zetro.projects.api': '^0.5.0' },
  id: 'zetro.tasks.api',
  lifecycle: {
    activate: 'Initialize the repository and register task routes.',
    deactivate: 'Stop accepting new task requests with the API runtime.',
    install: 'Create the module-owned task table and import legacy tasks once.',
    uninstall: 'Preserve task storage for recoverability.',
    upgrade: 'Version 0.4.0 migrates tasks to SQLite or MariaDB.',
  },
  publicContracts: ['GET /api/v1/tasks', 'POST /api/v1/tasks', 'PATCH /api/v1/tasks/:taskId'],
  scope: 'zetro-api',
  version: '0.4.0',
} as const

export async function registerTasksModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  projects: ProjectService,
  database: ZetroDatabase,
) {
  const repository = new TaskRepository(
    database,
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'tasks.json'),
    defaultProjectId,
  )
  await repository.initialize()
  await registerTaskRoutes(server, new TaskService(repository), projects)
}
