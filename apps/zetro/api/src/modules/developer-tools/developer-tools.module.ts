import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { SystemTaskService } from '../system-tasks/index.js'
import type { ProjectService } from '../projects/index.js'
import { DeveloperToolsRepository } from './developer-tools.repository.js'
import { registerDeveloperToolRoutes } from './developer-tools.routes.js'
import { DeveloperToolsService } from './developer-tools.service.js'

export const developerToolsModuleManifest = {
  capabilities: [
    'git-status-monitoring',
    'branch-compare',
    'branch-create',
    'branch-sync',
    'commit',
    'push',
    'revert-commit',
    'external-editor',
    'file-browser',
    'terminal-launch',
    'global-settings',
    'project-settings',
    'file-and-hunk-staging',
    'side-by-side-diff',
    'history-and-blame',
    'merge-conflict-resolution',
    'repository-task-runner',
    'branch-cleanup',
    'stash-management',
    'pull-request-create',
    'protected-branch-policy',
  ],
  dataSchema: { checksum: 'developer-tools-001-settings-v1', version: 1 },
  dependencies: { 'zetro.projects.api': '^0.5.0', 'zetro.system-tasks.api': '^1.0.0' },
  id: 'zetro.developer-tools.api',
  lifecycle: {
    activate: 'Register repository-bound developer tool routes.',
    deactivate: 'Stop accepting developer tool requests.',
    install: 'Create private global and project tool settings.',
    uninstall: 'Preserve settings and repository history.',
    upgrade: 'Version 1.0.0 adds repository review, staging, recovery, and delivery tools.',
  },
  publicContracts: ['DeveloperToolsService', '/api/v1/developer-tools/*'],
  scope: 'zetro-api',
  version: '1.0.0',
} as const

export async function registerDeveloperToolsModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  projects: ProjectService,
  database: ZetroDatabase,
  systemTasks: SystemTaskService,
) {
  const repository = new DeveloperToolsRepository(
    database,
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'developer-tools.json'),
  )
  await repository.initialize()
  const service = new DeveloperToolsService(repository, projects, systemTasks)
  await registerDeveloperToolRoutes(server, service)
  return service
}
