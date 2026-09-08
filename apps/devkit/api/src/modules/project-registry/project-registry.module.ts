import { resolve } from 'node:path'
import type { DevkitEnvironment } from '../../config.js'
import type { FastifyInstance } from 'fastify'
import { ProjectRegistryRepository } from './project-registry.repository.js'
import { registerProjectRegistryRoutes } from './project-registry.routes.js'
import { ProjectRegistryService } from './project-registry.service.js'

export const projectRegistryModuleManifest = {
  capabilities: [
    'hierarchical-registry',
    'json-registry',
    'module-profile',
    'development-confirmation',
  ],
  dependencies: {},
  id: 'devkit.project-registry.api',
  lifecycle: {
    activate: 'Registers project registry routes.',
    deactivate: 'Stops route handling with the runtime.',
    install: 'Creates the JSON registry on first read.',
    uninstall: 'Preserves the JSON registry.',
    upgrade: 'Migrates compatible legacy planning records and seeds the identity spine on read.',
  },
  publicContracts: [
    'GET /api/devkit/v1/project-registry',
    'POST /api/devkit/v1/project-registry/nodes',
    'PUT /api/devkit/v1/project-registry/nodes/:id',
    'POST /api/devkit/v1/project-registry/nodes/:id/profile/:section',
    'POST /api/devkit/v1/project-registry/:id/confirm',
  ],
  scope: 'devkit',
  version: '0.7.1',
} as const

export async function registerProjectRegistryModule(
  server: FastifyInstance,
  environment: DevkitEnvironment,
  projectRoot: string,
): Promise<void> {
  const repository = new ProjectRegistryRepository(
    resolve(projectRoot, environment.DEVKIT_REGISTRY_PATH),
  )
  await registerProjectRegistryRoutes(server, new ProjectRegistryService(repository))
}
