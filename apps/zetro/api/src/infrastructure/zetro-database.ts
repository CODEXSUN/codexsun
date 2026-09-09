import Database from 'better-sqlite3'
import { mkdir } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { Kysely, MysqlDialect, SqliteDialect, sql } from 'kysely'
import { createPool } from 'mysql2'
import type { ZetroEnvironment } from '../config.js'

type EmptySchema = Record<string, never>

export interface ZetroMigration {
  checksum: string
  id: string
  up(database: Kysely<EmptySchema>, driver: 'mariadb' | 'sqlite'): Promise<void>
}

export class ZetroDatabase {
  private constructor(
    public readonly driver: 'mariadb' | 'sqlite',
    private readonly client: Kysely<EmptySchema>,
    private readonly sqlite?: Database.Database,
  ) {}

  public static async open(
    environment: ZetroEnvironment,
    projectRoot: string,
  ): Promise<ZetroDatabase> {
    if (environment.DB_DRIVER === 'mariadb') {
      const pool = createPool({
        connectionLimit: 10,
        database: environment.DB_MASTER_NAME,
        enableKeepAlive: true,
        host: environment.DB_HOST,
        password: environment.DB_PASSWORD,
        port: environment.DB_PORT,
        user: environment.DB_USER,
      })
      return new ZetroDatabase(
        'mariadb',
        new Kysely<EmptySchema>({ dialect: new MysqlDialect({ pool }) }),
      )
    }

    const storageRoot = isAbsolute(environment.STORAGE_ROOT)
      ? environment.STORAGE_ROOT
      : resolve(projectRoot, environment.STORAGE_ROOT)
    const filePath = resolve(storageRoot, environment.ZETRO_SQLITE_PATH)
    return this.openSqlite(filePath)
  }

  public static async openSqlite(filePath: string): Promise<ZetroDatabase> {
    await mkdir(dirname(filePath), { recursive: true })
    const sqlite = new Database(filePath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('synchronous = NORMAL')
    sqlite.pragma('foreign_keys = ON')
    sqlite.pragma('busy_timeout = 5000')
    return new ZetroDatabase(
      'sqlite',
      new Kysely<EmptySchema>({ dialect: new SqliteDialect({ database: sqlite }) }),
      sqlite,
    )
  }

  public forModule<T extends object>(): Kysely<T> {
    return this.client as unknown as Kysely<T>
  }

  public async migrate(moduleId: string, migrations: readonly ZetroMigration[]): Promise<void> {
    await createMigrationLedger(this.client, this.driver)
    for (const migration of migrations) await this.applyMigration(moduleId, migration)
  }

  public async check(): Promise<void> {
    await sql`select 1 as health_check`.execute(this.client)
  }

  public async backup(destination: string): Promise<void> {
    if (!this.sqlite) throw new Error('Use the MariaDB backup service for server storage.')
    await mkdir(dirname(destination), { recursive: true })
    await this.sqlite.backup(destination)
  }

  public close(): Promise<void> {
    return this.client.destroy()
  }

  private async applyMigration(moduleId: string, migration: ZetroMigration): Promise<void> {
    const applied = await sql<{ checksum: string }>`
      select checksum from zetro_module_migrations
      where module_id = ${moduleId} and migration_id = ${migration.id}
    `.execute(this.client)
    const checksum = applied.rows[0]?.checksum
    if (checksum && checksum !== migration.checksum) {
      throw new Error(`Migration checksum mismatch for ${moduleId}:${migration.id}.`)
    }
    if (checksum) return

    await this.client.transaction().execute(async (transaction) => {
      await migration.up(transaction, this.driver)
      await sql`
        insert into zetro_module_migrations
          (module_id, migration_id, checksum, applied_at)
        values (${moduleId}, ${migration.id}, ${migration.checksum}, ${new Date().toISOString()})
      `.execute(transaction)
    })
  }
}

async function createMigrationLedger(
  database: Kysely<EmptySchema>,
  driver: 'mariadb' | 'sqlite',
): Promise<void> {
  const text = driver === 'mariadb' ? 'varchar(191)' : 'text'
  await sql
    .raw(
      `
    create table if not exists zetro_module_migrations (
      module_id ${text} not null,
      migration_id ${text} not null,
      checksum ${text} not null,
      applied_at ${text} not null,
      primary key (module_id, migration_id)
    )
  `,
    )
    .execute(database)
}
