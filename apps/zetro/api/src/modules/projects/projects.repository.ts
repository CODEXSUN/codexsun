import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ZetroProject } from './projects.types.js'

export class ProjectRepository {
  private projects: ZetroProject[] = []

  public constructor(private readonly filePath: string) {}

  public async initialize(defaultProject?: ZetroProject): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    try {
      const stored = JSON.parse(await readFile(this.filePath, 'utf8')) as ZetroProject[]
      const requiresMigration = stored.some(needsIdentityMigration)
      this.projects = stored.map(normalizeProject)
      if (requiresMigration) await this.persist()
    } catch (error) {
      if (!isMissingFile(error)) throw error
    }

    if (defaultProject && !this.projects.some(({ id }) => id === defaultProject.id)) {
      this.projects.unshift(defaultProject)
      await this.persist()
    }
  }

  public list(archived = false): readonly ZetroProject[] {
    return this.projects
      .filter((project) => project.archived === archived)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  }

  public all(): readonly ZetroProject[] {
    return [...this.projects]
  }

  public find(projectId: string): ZetroProject | undefined {
    return this.projects.find(({ id }) => id === projectId)
  }

  public async save(project: ZetroProject): Promise<void> {
    this.projects.push(project)
    await this.persist()
  }

  public async update(project: ZetroProject): Promise<void> {
    this.projects = this.projects.map((current) => (current.id === project.id ? project : current))
    await this.persist()
  }

  public async delete(projectId: string): Promise<void> {
    this.projects = this.projects.filter(({ id }) => id !== projectId)
    await this.persist()
  }

  private async persist(): Promise<void> {
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(this.projects, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }
}

function needsIdentityMigration(project: ZetroProject): boolean {
  return (
    typeof project.archived !== 'boolean' ||
    typeof project.githubUrl !== 'string' ||
    typeof project.logoColor !== 'string' ||
    typeof project.logoText !== 'string' ||
    typeof project.tagline !== 'string'
  )
}

function normalizeProject(project: ZetroProject): ZetroProject {
  return {
    ...project,
    archived: project.archived ?? false,
    githubUrl: project.githubUrl ?? '',
    logoColor: project.logoColor ?? '#18181b',
    logoText: project.logoText ?? project.name.trim().slice(0, 2).toUpperCase(),
    tagline: project.tagline ?? 'Project workspace',
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
