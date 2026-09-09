import { readFile } from 'node:fs/promises'
import type { Kysely } from 'kysely'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { DeveloperToolsDatabase } from './developer-tools.database.js'
import { developerToolsMigrations } from './developer-tools.migrations.js'
import type {
  DeveloperToolRegistry,
  DeveloperToolSettings,
  ProjectToolSettings,
} from './developer-tools.types.js'

export const defaultToolSettings: DeveloperToolSettings = {
  allowForceWithLease: false,
  allowPullRequests: false,
  allowPush: true,
  autoRefreshSeconds: 15,
  branchPrefix: 'codex/',
  commitInstructions: '',
  compareBranch: 'main',
  desktopNotifications: true,
  editor: 'auto',
  protectedBranches: ['main', 'master'],
  trustedRepository: false,
}

export class DeveloperToolsRepository {
  private registry: DeveloperToolRegistry = { global: defaultToolSettings, projects: {} }
  private readonly database: Kysely<DeveloperToolsDatabase>

  public constructor(
    private readonly databaseProvider: ZetroDatabase,
    private readonly legacyFilePath: string,
  ) {
    this.database = databaseProvider.forModule<DeveloperToolsDatabase>()
  }

  public async initialize(): Promise<void> {
    await this.databaseProvider.migrate('zetro.developer-tools.api', developerToolsMigrations)
    const rows = await this.database
      .selectFrom('zetro_developer_tool_settings')
      .select(['data', 'scope_key'])
      .execute()
    if (rows.length > 0) {
      const global = rows.find(({ scope_key }) => scope_key === 'global')
      this.registry.global = {
        ...defaultToolSettings,
        ...(global ? (JSON.parse(global.data) as Partial<DeveloperToolSettings>) : {}),
      }
      for (const row of rows.filter(({ scope_key }) => scope_key !== 'global')) {
        this.registry.projects[row.scope_key] = normalizeProjectSettings(
          JSON.parse(row.data) as Partial<ProjectToolSettings>,
        )
      }
      return
    }
    try {
      const stored = JSON.parse(
        await readFile(this.legacyFilePath, 'utf8'),
      ) as Partial<DeveloperToolRegistry>
      this.registry = {
        global: { ...defaultToolSettings, ...stored.global },
        projects: Object.fromEntries(
          Object.entries(stored.projects ?? {}).map(([key, value]) => [
            key,
            normalizeProjectSettings(value),
          ]),
        ),
      }
    } catch (error) {
      if (!isMissingFile(error)) throw error
    }
    await this.write('global', this.registry.global, false)
    for (const [projectId, settings] of Object.entries(this.registry.projects)) {
      await this.write(projectId, settings, false)
    }
  }

  public getGlobal(): DeveloperToolSettings {
    return { ...this.registry.global }
  }

  public getProject(projectId: string): ProjectToolSettings {
    return this.registry.projects[projectId] ?? { ...this.registry.global, inheritGlobal: true }
  }

  public async setGlobal(settings: DeveloperToolSettings): Promise<void> {
    this.registry.global = settings
    await this.write('global', settings, true)
  }

  public async setProject(projectId: string, settings: ProjectToolSettings): Promise<void> {
    const exists = projectId in this.registry.projects
    this.registry.projects[projectId] = settings
    await this.write(projectId, settings, exists)
  }

  private async write(scopeKey: string, settings: unknown, exists: boolean): Promise<void> {
    const row = {
      data: JSON.stringify(settings),
      scope_key: scopeKey,
      updated_at: new Date().toISOString(),
    }
    if (exists) {
      await this.database
        .updateTable('zetro_developer_tool_settings')
        .set(row)
        .where('scope_key', '=', scopeKey)
        .execute()
      return
    }
    await this.database.insertInto('zetro_developer_tool_settings').values(row).execute()
  }
}

function normalizeProjectSettings(settings: Partial<ProjectToolSettings>): ProjectToolSettings {
  return { ...defaultToolSettings, ...settings, inheritGlobal: settings.inheritGlobal ?? true }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}
