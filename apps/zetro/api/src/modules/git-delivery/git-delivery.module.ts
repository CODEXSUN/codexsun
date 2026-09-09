import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { DeveloperToolsService } from '../developer-tools/index.js'
import type { ProjectService } from '../projects/index.js'
import { GitDeliveryRepository } from './git-delivery.repository.js'
import { registerGitDeliveryRoutes } from './git-delivery.routes.js'
import { GitDeliveryService } from './git-delivery.service.js'

export const gitDeliveryModuleManifest = {
  capabilities: [
    'release-preview',
    'changelog-command',
    'version-command',
    'pull-strategy',
    'reviewed-commit',
    'reviewed-push',
    'delivery-flow-history',
    'global-settings',
    'project-settings',
  ],
  dependencies: {
    'zetro.developer-tools.api': '^0.2.0',
    'zetro.projects.api': '^0.4.1',
  },
  id: 'zetro.git-delivery.api',
  lifecycle: {
    activate: 'Register project Git delivery flow routes.',
    deactivate: 'Stop accepting Git delivery flow requests.',
    install: 'Create private Git delivery settings and flow history.',
    uninstall: 'Preserve delivery history and repository data.',
    upgrade: 'Add repository-owned release and GitHub delivery workflows.',
  },
  publicContracts: ['GitDeliveryService', '/api/v1/git-delivery/*'],
  scope: 'zetro-api',
  version: '0.1.0',
} as const

export async function registerGitDeliveryModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  projects: ProjectService,
  developerTools: DeveloperToolsService,
) {
  const repository = new GitDeliveryRepository(
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'git-delivery.json'),
  )
  await repository.initialize()
  const service = new GitDeliveryService(repository, projects, developerTools)
  await registerGitDeliveryRoutes(server, service)
  return service
}
