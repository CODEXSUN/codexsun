import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import { ProjectRepository } from './projects.repository.js'
import { registerProjectRoutes } from './projects.routes.js'
import { createDefaultProject, ProjectService } from './projects.service.js'

export const projectsModuleManifest = {
  capabilities: [
    'project-create',
    'project-list',
    'project-rename',
    'project-archive',
    'repository-workspace-binding',
  ],
  dependencies: {},
  id: 'zetro.projects.api',
  lifecycle: {
    activate: 'Register validated project routes.',
    deactivate: 'Stop accepting project requests with the API runtime.',
    install: 'Create the private project registry with the default checkout.',
    uninstall: 'Preserve projects and dependent work for recoverability.',
    upgrade: 'Add the archived flag to stored project records.',
  },
  publicContracts: [
    'GET /api/v1/projects',
    'GET /api/v1/projects/:projectId',
    'POST /api/v1/projects',
    'PATCH /api/v1/projects/:projectId',
  ],
  scope: 'zetro-api',
  version: '0.2.0',
} as const

export async function registerProjectsModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
) {
  const repository = new ProjectRepository(
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'projects.json'),
  )
  await repository.initialize(createDefaultProject(projectRoot))
  const service = new ProjectService(repository)
  await registerProjectRoutes(server, service)
  return service
}
