import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import { ProjectRepository } from './projects.repository.js'
import { registerProjectRoutes } from './projects.routes.js'
import {
  createDefaultProject,
  defaultProjectId,
  findGitRepositoryRoot,
  isGeneratedDesktopPlaceholder,
  ProjectService,
} from './projects.service.js'

export const projectsModuleManifest = {
  capabilities: [
    'project-create',
    'project-list',
    'project-rename',
    'project-archive',
    'project-identity',
    'empty-project-onboarding',
    'repository-browser',
    'repository-root-resolution',
    'repository-workspace-binding',
  ],
  dependencies: {},
  dataSchema: { checksum: 'projects-001-projects-v1', version: 1 },
  id: 'zetro.projects.api',
  lifecycle: {
    activate: 'Register validated project routes.',
    deactivate: 'Stop accepting project requests with the API runtime.',
    install: 'Create the module-owned project table and import the legacy registry once.',
    uninstall: 'Preserve projects and dependent work for recoverability.',
    upgrade: 'Version 0.5.0 migrates projects to SQLite or MariaDB.',
  },
  publicContracts: [
    'GET /api/v1/projects',
    'GET /api/v1/projects/:projectId',
    'GET /api/v1/projects/directories',
    'POST /api/v1/projects',
    'PATCH /api/v1/projects/:projectId',
  ],
  scope: 'zetro-api',
  version: '0.5.0',
} as const

export async function registerProjectsModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
  database: ZetroDatabase,
) {
  const repository = new ProjectRepository(
    database,
    resolve(projectRoot, environment.STORAGE_ROOT, 'private', 'zetro', 'projects.json'),
  )
  const repositoryRoot = await findGitRepositoryRoot(projectRoot)
  await repository.initialize(repositoryRoot ? createDefaultProject(repositoryRoot) : undefined)
  const generatedProject = repository.find(defaultProjectId)
  if (
    !repositoryRoot &&
    generatedProject &&
    isGeneratedDesktopPlaceholder(generatedProject, projectRoot)
  ) {
    await repository.delete(defaultProjectId)
  }
  const service = new ProjectService(repository)
  await registerProjectRoutes(server, service)
  return service
}
