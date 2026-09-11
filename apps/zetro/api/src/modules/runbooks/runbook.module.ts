import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import { GitWorktreeService } from '../coding-workers/index.js'
import { RunbookService } from './application/runbook.service.js'
import { CodexRunbookExecutor } from './infrastructure/codex-runbook.executor.js'
import { SqliteRunbookRepository } from './infrastructure/runbook.repository.js'
import { registerRunbookRoutes } from './presentation/runbook.routes.js'

export const runbookModuleManifest = {
  capabilities: ['scheduled-isolated-workers', 'run-report-registry', 'runbook-scheduling'],
  dependencies: { 'zetro.coding-workers.api': '^1.0.0' },
  id: 'zetro.runbooks.api',
  lifecycle: { activate: 'Starts the bounded local runbook scheduler.', deactivate: 'Stops new scheduling and closes SQLite.', install: 'Applies owned SQLite migrations.', uninstall: 'Preserves run history.', upgrade: 'Adds immutable migrations.' },
  publicContracts: ['GET /api/zetro/v1/runbooks', 'POST /api/zetro/v1/runbooks', 'POST /api/zetro/v1/runbooks/:runbookId/start'],
  scope: 'zetro-api',
  version: '1.0.0',
} as const

export async function registerRunbookModule(server: FastifyInstance, environment: ZetroEnvironment, projectRoot: string) {
  const repository = new SqliteRunbookRepository(resolve(projectRoot, environment.ZETRO_DATABASE_PATH))
  const service = new RunbookService(repository, new GitWorktreeService(), new CodexRunbookExecutor())
  await registerRunbookRoutes(server, service)
  service.startScheduler()
  return service
}
