import { randomUUID } from 'node:crypto'
import type { Kysely } from 'kysely'
import type { ZetroDatabase } from '../../infrastructure/zetro-database.js'
import type { OperationsDatabase } from './operations.database.js'
import { operationsMigrations } from './operations.migrations.js'
import type { ConnectedAppMetric, OperationsSettings } from './operations.types.js'

export const defaultOperationsSettings: OperationsSettings = {
  autoSweepWorktrees: false,
  metricRetentionDays: 30,
  worktreeRetentionDays: 30,
}

export class OperationsRepository {
  private readonly database: Kysely<OperationsDatabase>
  private settings = defaultOperationsSettings

  public constructor(private readonly databaseProvider: ZetroDatabase) {
    this.database = databaseProvider.forModule<OperationsDatabase>()
  }

  public async initialize(): Promise<void> {
    await this.databaseProvider.migrate('zetro.operations.api', operationsMigrations)
    const row = await this.database
      .selectFrom('zetro_operations_settings')
      .select('data')
      .where('scope_key', '=', 'global')
      .executeTakeFirst()
    if (row) this.settings = { ...defaultOperationsSettings, ...JSON.parse(row.data) }
    else await this.insertSettings()
  }

  public getSettings(): OperationsSettings {
    return { ...this.settings }
  }

  public async setSettings(settings: OperationsSettings): Promise<void> {
    this.settings = settings
    await this.database
      .updateTable('zetro_operations_settings')
      .set({ data: JSON.stringify(settings), updated_at: new Date().toISOString() })
      .where('scope_key', '=', 'global')
      .execute()
  }

  public async addMetric(metric: ConnectedAppMetric): Promise<void> {
    await this.database
      .insertInto('zetro_connected_app_metrics')
      .values({
        app_id: metric.appId,
        data: JSON.stringify(metric),
        id: randomUUID(),
        observed_at: metric.observedAt,
        received_at: metric.receivedAt,
      })
      .execute()
  }

  public async latestMetrics(): Promise<ConnectedAppMetric[]> {
    const rows = await this.database
      .selectFrom('zetro_connected_app_metrics')
      .select('data')
      .orderBy('observed_at', 'desc')
      .limit(500)
      .execute()
    const latest = new Map<string, ConnectedAppMetric>()
    for (const row of rows) {
      const metric = JSON.parse(row.data) as ConnectedAppMetric
      if (!latest.has(metric.appId)) latest.set(metric.appId, metric)
    }
    return [...latest.values()]
  }

  public async pruneMetrics(retentionDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000).toISOString()
    const result = await this.database
      .deleteFrom('zetro_connected_app_metrics')
      .where('received_at', '<', cutoff)
      .executeTakeFirst()
    return Number(result.numDeletedRows)
  }

  private async insertSettings(): Promise<void> {
    await this.database
      .insertInto('zetro_operations_settings')
      .values({
        data: JSON.stringify(this.settings),
        scope_key: 'global',
        updated_at: new Date().toISOString(),
      })
      .execute()
  }
}
