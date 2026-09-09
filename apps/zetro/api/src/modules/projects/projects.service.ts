import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { promisify } from 'node:util'
import type { ProjectRepository } from './projects.repository.js'
import type {
  CreateProjectInput,
  ProjectDirectoryListing,
  UpdateProjectInput,
  ZetroProject,
} from './projects.types.js'

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
    const repositoryPath = await resolveGitRepository(input.repositoryPath)
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
      githubUrl: '',
      id: randomUUID(),
      logoColor: '#18181b',
      logoText: createLogoText(input.name),
      name: input.name,
      repositoryPath,
      tagline: 'Project workspace',
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
    const repositoryPath = input.repositoryPath
      ? await this.validateRepositoryPath(input.repositoryPath, projectId)
      : current.repositoryPath
    const project = {
      ...current,
      ...input,
      logoText: input.logoText?.toUpperCase() ?? current.logoText,
      repositoryPath,
      updatedAt: new Date().toISOString(),
    }
    await this.repository.update(project)
    return project
  }

  public async browseDirectories(path: string): Promise<ProjectDirectoryListing> {
    if (!isAbsolute(path)) throw new InvalidProjectRepositoryError('Use an absolute folder path.')
    const currentPath = resolve(path)
    await requireDirectory(currentPath)
    const entries = await readdir(currentPath, { withFileTypes: true })
    return {
      directories: entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
        .map((entry) => ({ name: entry.name, path: resolve(currentPath, entry.name) }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      parentPath: dirname(currentPath) === currentPath ? null : dirname(currentPath),
      path: currentPath,
    }
  }

  private async validateRepositoryPath(path: string, projectId: string): Promise<string> {
    if (!isAbsolute(path))
      throw new InvalidProjectRepositoryError('Use an absolute repository path.')
    const repositoryPath = await resolveGitRepository(path)
    if (
      this.repository
        .all()
        .some(
          (project) =>
            project.id !== projectId &&
            project.repositoryPath.toLowerCase() === repositoryPath.toLowerCase(),
        )
    ) {
      throw new ProjectRepositoryAlreadyExistsError('This repository is already registered.')
    }
    return repositoryPath
  }
}

export function isGeneratedDesktopPlaceholder(project: ZetroProject, projectRoot: string): boolean {
  return (
    project.id === defaultProjectId &&
    project.repositoryPath.toLowerCase() === resolve(projectRoot).toLowerCase() &&
    project.name === 'CODEXSUN' &&
    project.githubUrl === '' &&
    project.logoColor === '#18181b' &&
    project.logoText === 'CS' &&
    project.tagline === 'Project workspace' &&
    project.createdAt === project.updatedAt
  )
}

export async function findGitRepositoryRoot(path: string): Promise<string | null> {
  try {
    await requireDirectory(path)
    const result = await execute('git', ['-C', path, 'rev-parse', '--show-toplevel'], {
      windowsHide: true,
    })
    return resolve(result.stdout.trim())
  } catch {
    return null
  }
}

export function createDefaultProject(projectRoot: string): ZetroProject {
  const now = new Date().toISOString()
  return {
    archived: false,
    createdAt: now,
    githubUrl: '',
    id: defaultProjectId,
    logoColor: '#18181b',
    logoText: 'CS',
    name: 'CODEXSUN',
    repositoryPath: resolve(projectRoot),
    tagline: 'Project workspace',
    updatedAt: now,
  }
}

function createLogoText(name: string) {
  const words = name.trim().split(/\s+/)
  return (words.length > 1 ? words.map((word) => word[0]).join('') : name).slice(0, 2).toUpperCase()
}

async function requireDirectory(path: string): Promise<void> {
  try {
    if (!(await stat(path)).isDirectory()) throw new Error('not-directory')
  } catch {
    throw new InvalidProjectRepositoryError('Repository path must be an existing directory.')
  }
}

const execute = promisify(execFile)

async function resolveGitRepository(path: string): Promise<string> {
  const requestedPath = resolve(path)
  await requireDirectory(requestedPath)
  const repositoryRoot = await findGitRepositoryRoot(requestedPath)
  if (repositoryRoot) return repositoryRoot
  throw new InvalidProjectRepositoryError('Select a folder inside a Git repository.')
}
