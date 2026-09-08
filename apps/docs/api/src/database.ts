import { Kysely, MysqlDialect } from 'kysely'
import { createPool } from 'mysql2'
import type { DocsEnvironment } from './config.js'

export interface DocsDatabase {
  docs_documents: {
    aliases_json: string
    description: string
    links_json: string
    slug: string
    source_hash: string
    source_path: string
    tags_json: string
    title: string
    updated_at: string
  }
}

export function createDatabase(environment: DocsEnvironment): Kysely<DocsDatabase> {
  return new Kysely<DocsDatabase>({
    dialect: new MysqlDialect({
      pool: createPool({
        database: environment.DATABASE_NAME,
        host: environment.DATABASE_HOST,
        password: environment.DATABASE_PASSWORD,
        port: environment.DATABASE_PORT,
        user: environment.DATABASE_USER,
      }),
    }),
  })
}
