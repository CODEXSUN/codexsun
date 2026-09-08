import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ZetroProject } from './projects.types.js'

export class ProjectRepository {
  private projects: ZetroProject[] = []

  public constructor(private readonly filePath: string) {}

  public async initialize(defaultProject: ZetroProject): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    try {
      const stored = JSON.parse(await readFile(this.filePath, 'utf8')) as ZetroProject[]
      const requiresMigration = stored.some(({ archived }) => typeof archived !== 'boolean')
      this.projects = stored.map((project) => ({ ...project, archived: project.archived ?? false }))
      if (requiresMigration) await this.persist()
    } catch (error) {
      if (!isMissingFile(error)) throw error
    }

    if (!this.projects.some(({ id }) => id === defaultProject.id)) {
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

  private async persist(): Promise<void> {
    const temporaryPath = `${this.filePath}.tmp`
    await writeFile(temporaryPath, `${JSON.stringify(this.projects, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, this.filePath)
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
