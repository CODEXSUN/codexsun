import { readFile } from 'node:fs/promises'
import type { Kysely } from 'kysely'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { ProjectsDatabase } from './projects.database.js'
import { projectsMigrations } from './projects.migrations.js'
import type { ZetroProject } from './projects.types.js'

export class ProjectRepository {
  private projects: ZetroProject[] = []
  private readonly database: Kysely<ProjectsDatabase>
  private readonly databaseProvider: ZetroDatabase

  public constructor(
    databaseProvider: ZetroDatabase,
    private readonly legacyFilePath: string,
  ) {
    this.databaseProvider = databaseProvider
    this.database = databaseProvider.forModule<ProjectsDatabase>()
  }

  public async initialize(defaultProject?: ZetroProject): Promise<void> {
    await this.migrate()
    this.projects = await this.readAll()
    if (this.projects.length === 0) await this.importLegacy()

    if (defaultProject && !this.projects.some(({ id }) => id === defaultProject.id)) {
      this.projects.unshift(defaultProject)
      await this.insert(defaultProject)
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
    await this.insert(project)
  }

  public async update(project: ZetroProject): Promise<void> {
    this.projects = this.projects.map((current) => (current.id === project.id ? project : current))
    await this.database
      .updateTable('zetro_projects')
      .set(toRow(project))
      .where('id', '=', project.id)
      .execute()
  }

  public async delete(projectId: string): Promise<void> {
    this.projects = this.projects.filter(({ id }) => id !== projectId)
    await this.database.deleteFrom('zetro_projects').where('id', '=', projectId).execute()
  }

  private migrate(): Promise<void> {
    return this.databaseProvider.migrate('zetro.projects.api', projectsMigrations)
  }

  private async readAll(): Promise<ZetroProject[]> {
    const rows = await this.database.selectFrom('zetro_projects').select('data').execute()
    return rows.map(({ data }) => normalizeProject(JSON.parse(data) as ZetroProject))
  }

  private async importLegacy(): Promise<void> {
    try {
      const stored = JSON.parse(await readFile(this.legacyFilePath, 'utf8')) as ZetroProject[]
      for (const project of stored.map(normalizeProject)) await this.insert(project)
      this.projects = stored.map(normalizeProject)
    } catch (error) {
      if (!isMissingFile(error)) throw error
    }
  }

  private async insert(project: ZetroProject): Promise<void> {
    await this.database.insertInto('zetro_projects').values(toRow(project)).execute()
  }
}

function toRow(project: ZetroProject) {
  return {
    archived: project.archived ? 1 : 0,
    created_at: project.createdAt,
    data: JSON.stringify(project),
    id: project.id,
    updated_at: project.updatedAt,
  }
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
