import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { CodingWorkerTaskSource } from './application/coding-worker.ports.js'
import { CodingWorkerService } from './application/coding-worker.service.js'
import { GitWorktreeService } from './infrastructure/git-worktree.service.js'
import { CodingWorkerRepository } from './infrastructure/coding-worker.repository.js'
import { registerCodingWorkerRoutes } from './presentation/coding-worker.routes.js'

export const codingWorkerModuleManifest = {
  capabilities: ['isolated-worktree-preparation', 'worker-handoff', 'worker-attempt-registry'],
  dependencies: { 'zetro.agent-tasks.api': '^1.0.0' },
  id: 'zetro.coding-workers.api',
  lifecycle: {
    activate: 'Registers coding worker handoff and attempt registry routes.',
    deactivate: 'Closes coding worker SQLite storage.',
    install: 'Applies owned coding worker SQLite migrations.',
    uninstall: 'Preserves worker attempts and worktrees.',
    upgrade: 'Adds migrations without changing applied checksums.',
  },
  publicContracts: [
    'GET /api/zetro/v1/coding-workers',
    'POST /api/zetro/v1/coding-workers/prepare',
  ],
  scope: 'zetro-api',
  version: '1.0.0',
} as const

export async function registerCodingWorkerModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  tasks: CodingWorkerTaskSource,
) {
  const repository = new CodingWorkerRepository(
    resolve(projectRoot, environment.ZETRO_DATABASE_PATH),
  )
  const service = new CodingWorkerService(tasks, new GitWorktreeService(), repository)
  await registerCodingWorkerRoutes(server, service)
  return service
}
