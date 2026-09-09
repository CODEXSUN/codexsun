import { sql } from 'kysely'
import type { Database } from '../../database.js'
import type {
  AppliedModuleDataRecord,
  DurableModuleRecord,
  DurableModuleState,
  ModuleRuntimeRepository,
  ModuleDataTransactionRunner,
  ModuleRuntimeLock,
} from './module-runtime.types.js'

const moduleRuntimeLockName = 'codexsun:platform-module-runtime'

export class MariaDbModuleRuntimeLock implements ModuleRuntimeLock {
  constructor(
    private readonly database: Database,
    private readonly timeoutSeconds = 10,
  ) {}

  async runExclusive<T>(action: () => Promise<T>): Promise<T> {
    return this.database.connection().execute(async (connection) => {
      const result = await sql<{
        acquired: number
      }>`select get_lock(${moduleRuntimeLockName}, ${this.timeoutSeconds}) as acquired`.execute(
        connection,
      )
      if (Number(result.rows[0]?.acquired) !== 1) {
        throw new Error('The module runtime migration lock could not be acquired.')
      }

      try {
        return await action()
      } finally {
        await sql`select release_lock(${moduleRuntimeLockName})`.execute(connection)
      }
    })
  }
}

export class KyselyModuleDataTransactionRunner implements ModuleDataTransactionRunner<Database> {
  constructor(private readonly database: Database) {}

  run<T>(
    action: (transaction: { context: Database; repository: ModuleRuntimeRepository }) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction().execute((transaction) =>
      action({
        context: transaction as Database,
        repository: new MariaDbModuleRuntimeRepository(transaction as Database),
      }),
    )
  }
}

export class MariaDbModuleRuntimeRepository implements ModuleRuntimeRepository {
  constructor(private readonly database: Database) {}

  async findMigration(
    moduleId: string,
    migrationId: string,
  ): Promise<AppliedModuleDataRecord | undefined> {
    const row = await this.database
      .selectFrom('platform_module_migrations')
      .select(['checksum', 'migration_id', 'module_id', 'module_version'])
      .where('module_id', '=', moduleId)
      .where('migration_id', '=', migrationId)
      .executeTakeFirst()
    return row
      ? {
          checksum: row.checksum,
          id: row.migration_id,
          moduleId: row.module_id,
          version: row.module_version,
        }
      : undefined
  }

  async findSeed(moduleId: string, seedId: string): Promise<AppliedModuleDataRecord | undefined> {
    const row = await this.database
      .selectFrom('platform_module_seeds')
      .select(['checksum', 'module_id', 'module_version', 'seed_id'])
      .where('module_id', '=', moduleId)
      .where('seed_id', '=', seedId)
      .executeTakeFirst()
    return row
      ? {
          checksum: row.checksum,
          id: row.seed_id,
          moduleId: row.module_id,
          version: row.module_version,
        }
      : undefined
  }

  async getModule(moduleId: string): Promise<DurableModuleRecord | undefined> {
    const row = await this.database
      .selectFrom('platform_module_state')
      .selectAll()
      .where('module_id', '=', moduleId)
      .executeTakeFirst()
    return row ? mapModuleRecord(row) : undefined
  }

  async listModules(): Promise<readonly DurableModuleRecord[]> {
    const rows = await this.database
      .selectFrom('platform_module_state')
      .selectAll()
      .orderBy('module_id')
      .execute()
    return rows.map(mapModuleRecord)
  }

  async recordMigration(
    record: AppliedModuleDataRecord,
    appliedAt: Date,
    durationMs: number,
  ): Promise<void> {
    await this.database
      .insertInto('platform_module_migrations')
      .values({
        applied_at: appliedAt,
        checksum: record.checksum,
        duration_ms: durationMs,
        migration_id: record.id,
        module_id: record.moduleId,
        module_version: record.version,
      })
      .execute()
  }

  async recordSeed(record: AppliedModuleDataRecord, appliedAt: Date): Promise<void> {
    await this.database
      .insertInto('platform_module_seeds')
      .values({
        applied_at: appliedAt,
        checksum: record.checksum,
        module_id: record.moduleId,
        module_version: record.version,
        seed_id: record.id,
      })
      .execute()
  }

  async saveModule(record: DurableModuleRecord): Promise<void> {
    const values = {
      enabled: record.enabled ? 1 : 0,
      installed_version: record.installedVersion ?? null,
      kind: record.kind,
      last_failure_code: record.lastFailureCode ?? null,
      last_failure_message: record.lastFailureMessage ?? null,
      manifest_checksum: record.manifestChecksum,
      module_id: record.moduleId,
      requested_version: record.requestedVersion,
      runtime_state: record.state,
      schema_checksum: record.schemaChecksum ?? null,
      updated_at: record.updatedAt,
    }
    await this.database
      .insertInto('platform_module_state')
      .values(values)
      .onDuplicateKeyUpdate(values)
      .execute()
  }
}

function mapModuleRecord(row: {
  enabled: number
  installed_version: string | null
  kind: string
  last_failure_code: string | null
  last_failure_message: string | null
  manifest_checksum: string
  module_id: string
  requested_version: string
  runtime_state: string
  schema_checksum: string | null
  updated_at: Date
}): DurableModuleRecord {
  return {
    enabled: row.enabled === 1,
    installedVersion: row.installed_version ?? undefined,
    kind: row.kind as DurableModuleRecord['kind'],
    lastFailureCode: row.last_failure_code ?? undefined,
    lastFailureMessage: row.last_failure_message ?? undefined,
    manifestChecksum: row.manifest_checksum,
    moduleId: row.module_id,
    requestedVersion: row.requested_version,
    schemaChecksum: row.schema_checksum ?? undefined,
    state: row.runtime_state as DurableModuleState,
    updatedAt: row.updated_at,
  }
}
