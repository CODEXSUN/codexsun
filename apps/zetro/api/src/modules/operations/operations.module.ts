import type { FastifyInstance } from 'fastify'
import { isAbsolute, resolve } from 'node:path'
import type { ZetroEnvironment } from '../../config.js'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { CodexConnectionService, CodexWorktreeService } from '../codex-connection/index.js'
import type { SystemTaskService } from '../system-tasks/index.js'
import { OperationsRepository } from './operations.repository.js'
import { registerOperationsRoutes } from './operations.routes.js'
import { OperationsService } from './operations.service.js'

export const operationsModuleManifest = {
  capabilities: [
    'runtime-metrics',
    'connected-app-metrics',
    'diagnostics-export',
    'worktree-metrics',
    'system-task-metrics',
  ],
  dataSchema: { checksum: 'operations-001-settings-metrics-v1', version: 1 },
  dependencies: {
    'zetro.codex-connection.api': '^0.8.0',
    'zetro.system-tasks.api': '^1.0.0',
  },
  id: 'zetro.operations.api',
  lifecycle: {
    activate: 'Register metrics, settings, connected application, and diagnostics routes.',
    deactivate: 'Stop accepting metric samples.',
    install: 'Create settings and connected application metric tables.',
    uninstall: 'Preserve operational history.',
    upgrade: 'Apply additive metric schema migrations.',
  },
  publicContracts: ['/api/v1/operations/*', 'POST /api/v1/connected-apps/metrics'],
  scope: 'zetro-api',
  version: '1.0.0',
} as const

export async function registerOperationsModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  database: ZetroDatabase,
  systemTasks: SystemTaskService,
  codex: CodexConnectionService,
  worktrees: CodexWorktreeService,
): Promise<void> {
  const storageRoot = isAbsolute(environment.STORAGE_ROOT)
    ? environment.STORAGE_ROOT
    : resolve(projectRoot, environment.STORAGE_ROOT)
  const service = new OperationsService(
    new OperationsRepository(database),
    systemTasks,
    codex,
    worktrees,
    storageRoot,
    environment.DB_DRIVER,
  )
  await service.initialize()
  await registerOperationsRoutes(server, service)
}
