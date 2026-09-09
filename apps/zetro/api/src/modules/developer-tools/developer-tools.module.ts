import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
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
  ],
  dependencies: { 'zetro.projects.api': '^0.4.1' },
  id: 'zetro.developer-tools.api',
  lifecycle: {
    activate: 'Register repository-bound developer tool routes.',
    deactivate: 'Stop accepting developer tool requests.',
    install: 'Create private global and project tool settings.',
    uninstall: 'Preserve settings and repository history.',
    upgrade: 'Add safe Git actions and trusted desktop launchers.',
  },
  publicContracts: ['DeveloperToolsService', '/api/v1/developer-tools/*'],
  scope: 'zetro-api',
  version: '0.2.0',
} as const

export async function registerDeveloperToolsModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  projects: ProjectService,
) {
  const repository = new DeveloperToolsRepository(
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'developer-tools.json'),
  )
  await repository.initialize()
  const service = new DeveloperToolsService(repository, projects)
  await registerDeveloperToolRoutes(server, service)
  return service
}
