import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { isAbsolute, resolve } from 'node:path'
import { promisify } from 'node:util'
import type { ProjectRepository } from './projects.repository.js'
import type { CreateProjectInput, UpdateProjectInput, ZetroProject } from './projects.types.js'

export const defaultProjectId = '00000000-0000-4000-8000-000000000001'

export class ProjectNotFoundError extends Error {}
export class InvalidProjectRepositoryError extends Error {}
export class ProjectRepositoryAlreadyExistsError extends Error {}
export class LastActiveProjectError extends Error {}

export class ProjectService {
  public constructor(private readonly repository: ProjectRepository) {}

  public list(archived = false): readonly ZetroProject[] {
    return this.repository.list(archived)
  }

  public get(projectId: string): ZetroProject {
    const project = this.repository.find(projectId)
    if (!project) throw new ProjectNotFoundError('Project not found.')
    return project
  }

  public async create(input: CreateProjectInput): Promise<ZetroProject> {
    if (!isAbsolute(input.repositoryPath)) {
      throw new InvalidProjectRepositoryError('Use an absolute repository path.')
    }
    const repositoryPath = resolve(input.repositoryPath)
    await requireDirectory(repositoryPath)
    await requireGitRepository(repositoryPath)
    if (
      this.repository
        .all()
        .some((project) => project.repositoryPath.toLowerCase() === repositoryPath.toLowerCase())
    ) {
      throw new ProjectRepositoryAlreadyExistsError('This repository is already registered.')
    }

    const now = new Date().toISOString()
    const project = {
      archived: false,
      createdAt: now,
      id: randomUUID(),
      name: input.name,
      repositoryPath,
      updatedAt: now,
    }
    await this.repository.save(project)
    return project
  }

  public async update(projectId: string, input: UpdateProjectInput): Promise<ZetroProject> {
    const current = this.get(projectId)
    if (input.archived && !current.archived && this.repository.list(false).length === 1) {
      throw new LastActiveProjectError('Add another project before archiving this project.')
    }
    const project = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    }
    await this.repository.update(project)
    return project
  }
}

export function createDefaultProject(projectRoot: string): ZetroProject {
  const now = new Date().toISOString()
  return {
    archived: false,
    createdAt: now,
    id: defaultProjectId,
    name: 'CODEXSUN',
    repositoryPath: resolve(projectRoot),
    updatedAt: now,
  }
}

async function requireDirectory(path: string): Promise<void> {
  try {
    if (!(await stat(path)).isDirectory()) throw new Error('not-directory')
  } catch {
    throw new InvalidProjectRepositoryError('Repository path must be an existing directory.')
  }
}

const execute = promisify(execFile)

async function requireGitRepository(path: string): Promise<void> {
  try {
    const result = await execute('git', ['-C', path, 'rev-parse', '--show-toplevel'], {
      windowsHide: true,
    })
    if (resolve(result.stdout.trim()).toLowerCase() !== path.toLowerCase()) {
      throw new Error('nested-repository')
    }
  } catch {
    throw new InvalidProjectRepositoryError('Repository path must be a Git repository root.')
  }
}
