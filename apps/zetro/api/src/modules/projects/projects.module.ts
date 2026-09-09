import { resolve } from 'node:path'
import type { FastifyInstance } from 'fastify'
import type { ZetroEnvironment } from '../../config.js'
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
  id: 'zetro.projects.api',
  lifecycle: {
    activate: 'Register validated project routes.',
    deactivate: 'Stop accepting project requests with the API runtime.',
    install:
      'Create the private project registry and add the startup folder when it is a Git repository.',
    uninstall: 'Preserve projects and dependent work for recoverability.',
    upgrade: 'Remove the untouched desktop placeholder and accept folders inside a Git repository.',
  },
  publicContracts: [
    'GET /api/v1/projects',
    'GET /api/v1/projects/:projectId',
    'GET /api/v1/projects/directories',
    'POST /api/v1/projects',
    'PATCH /api/v1/projects/:projectId',
  ],
  scope: 'zetro-api',
  version: '0.4.1',
} as const

export async function registerProjectsModule(
  server: FastifyInstance,
  environment: ZetroEnvironment,
  projectRoot: string,
) {
  const repository = new ProjectRepository(
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
