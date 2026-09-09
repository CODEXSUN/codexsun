import { Kysely, MysqlDialect, sql } from 'kysely'
import { createPool } from 'mysql2'
import type { Environment } from './config.js'
import type { ModuleRuntimeDatabaseSchema } from './modules/module-runtime/module-runtime.database.js'
import type { IdentityDatabaseSchema } from './modules/identity/index.js'

export type DatabaseSchema = IdentityDatabaseSchema & ModuleRuntimeDatabaseSchema
export type Database = Kysely<DatabaseSchema>

export interface PlatformDatabase {
  check(): Promise<void>
  close(): Promise<void>
  client: Database
}

export function createDatabase(environment: Environment): PlatformDatabase {
  const pool = createPool({
    connectionLimit: 10,
    database: environment.DB_MASTER_NAME,
    enableKeepAlive: true,
    host: environment.DB_HOST,
    password: environment.DB_PASSWORD,
    port: environment.DB_PORT,
    user: environment.DB_USER,
  })

  const client = new Kysely<DatabaseSchema>({
    dialect: new MysqlDialect({ pool }),
  })

  return {
    check: () => checkDatabase(client),
    client,
    close: () => client.destroy(),
  }
}

async function checkDatabase(database: Database): Promise<void> {
  await sql`select 1 as health_check`.execute(database)
}
