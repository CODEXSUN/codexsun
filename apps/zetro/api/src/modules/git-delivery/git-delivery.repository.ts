import { readFile } from 'node:fs/promises'
import type { Kysely } from 'kysely'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { GitDeliveryDatabase } from './git-delivery.database.js'
import { gitDeliveryMigrations } from './git-delivery.migrations.js'
import type {
  GitDeliveryFlowRecord,
  GitDeliveryRegistry,
  GitDeliverySettings,
  ProjectGitDeliverySettings,
} from './git-delivery.types.js'

export const defaultGitDeliverySettings: GitDeliverySettings = {
  defaultChangelog: true,
  defaultDatabaseUpdate: 'auto',
  defaultPush: true,
  defaultSyncStrategy: 'rebase',
  defaultVersionBump: true,
  enabled: true,
}

export class GitDeliveryRepository {
  private registry: GitDeliveryRegistry = {
    flows: [],
    global: defaultGitDeliverySettings,
    projects: {},
  }
  private readonly database: Kysely<GitDeliveryDatabase>

  public constructor(
    private readonly databaseProvider: ZetroDatabase,
    private readonly legacyFilePath: string,
  ) {
    this.database = databaseProvider.forModule<GitDeliveryDatabase>()
  }

  public async initialize(): Promise<void> {
    await this.databaseProvider.migrate('zetro.git-delivery.api', gitDeliveryMigrations)
    const [settings, flows] = await Promise.all([
      this.database.selectFrom('zetro_git_delivery_settings').selectAll().execute(),
      this.database
        .selectFrom('zetro_git_delivery_flows')
        .select('data')
        .orderBy('created_at', 'desc')
        .limit(50)
        .execute(),
    ])
    if (settings.length > 0 || flows.length > 0) {
      const global = settings.find(({ scope_key }) => scope_key === 'global')
      this.registry.global = {
        ...defaultGitDeliverySettings,
        ...(global ? (JSON.parse(global.data) as Partial<GitDeliverySettings>) : {}),
      }
      for (const row of settings.filter(({ scope_key }) => scope_key !== 'global')) {
        this.registry.projects[row.scope_key] = JSON.parse(row.data) as ProjectGitDeliverySettings
      }
      this.registry.flows = flows.map(({ data }) => normalizeFlow(JSON.parse(data)))
      return
    }
    try {
      const stored = JSON.parse(
        await readFile(this.legacyFilePath, 'utf8'),
      ) as Partial<GitDeliveryRegistry>
      this.registry = {
        flows: stored.flows?.slice(0, 50).map(normalizeFlow) ?? [],
        global: { ...defaultGitDeliverySettings, ...stored.global },
        projects: stored.projects ?? {},
      }
    } catch (error) {
      if (!isMissingFile(error)) throw error
    }
    await this.writeSettings('global', this.registry.global, false)
    for (const [projectId, projectSettings] of Object.entries(this.registry.projects)) {
      await this.writeSettings(projectId, projectSettings, false)
    }
    for (const flow of this.registry.flows) await this.writeFlow(flow, false)
  }

  public getGlobal(): GitDeliverySettings {
    return { ...this.registry.global }
  }

  public getProject(projectId: string): ProjectGitDeliverySettings {
    return this.registry.projects[projectId] ?? { ...this.registry.global, inheritGlobal: true }
  }

  public listFlows(projectId: string): GitDeliveryFlowRecord[] {
    return this.registry.flows.filter((flow) => flow.projectId === projectId).slice(0, 10)
  }

  public findFlow(flowId: string): GitDeliveryFlowRecord | undefined {
    return this.registry.flows.find(({ id }) => id === flowId)
  }

  public async saveFlow(flow: GitDeliveryFlowRecord): Promise<void> {
    const exists = this.registry.flows.some(({ id }) => id === flow.id)
    this.registry.flows = [flow, ...this.registry.flows.filter(({ id }) => id !== flow.id)].slice(
      0,
      50,
    )
    await this.writeFlow(flow, exists)
  }

  public async setGlobal(settings: GitDeliverySettings): Promise<void> {
    this.registry.global = settings
    await this.writeSettings('global', settings, true)
  }

  public async setProject(projectId: string, settings: ProjectGitDeliverySettings): Promise<void> {
    const exists = projectId in this.registry.projects
    this.registry.projects[projectId] = settings
    await this.writeSettings(projectId, settings, exists)
  }

  private async writeFlow(flow: GitDeliveryFlowRecord, exists: boolean): Promise<void> {
    const row = {
      created_at: flow.createdAt,
      data: JSON.stringify(flow),
      id: flow.id,
      project_id: flow.projectId,
      status: flow.status,
    }
    if (exists) {
      await this.database
        .updateTable('zetro_git_delivery_flows')
        .set(row)
        .where('id', '=', flow.id)
        .execute()
      return
    }
    await this.database.insertInto('zetro_git_delivery_flows').values(row).execute()
  }

  private async writeSettings(scopeKey: string, settings: unknown, exists: boolean): Promise<void> {
    const row = {
      data: JSON.stringify(settings),
      scope_key: scopeKey,
      updated_at: new Date().toISOString(),
    }
    if (exists) {
      await this.database
        .updateTable('zetro_git_delivery_settings')
        .set(row)
        .where('scope_key', '=', scopeKey)
        .execute()
      return
    }
    await this.database.insertInto('zetro_git_delivery_settings').values(row).execute()
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

function normalizeFlow(value: unknown): GitDeliveryFlowRecord {
  const flow = value as GitDeliveryFlowRecord & { systemTaskId?: string | null }
  return { ...flow, systemTaskId: flow.systemTaskId ?? null }
}
