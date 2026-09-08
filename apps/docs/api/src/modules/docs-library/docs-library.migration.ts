import type { Kysely } from 'kysely'
import type { DocsDatabase } from '../../database.js'

export async function migrateDocsLibrary(database: Kysely<DocsDatabase>): Promise<void> {
  await database.schema
    .createTable('docs_documents')
    .ifNotExists()
    .addColumn('slug', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('title', 'varchar(255)', (column) => column.notNull())
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('tags_json', 'text', (column) => column.notNull())
    .addColumn('aliases_json', 'text', (column) => column.notNull())
    .addColumn('links_json', 'text', (column) => column.notNull())
    .addColumn('source_path', 'varchar(512)', (column) => column.notNull())
    .addColumn('source_hash', 'char(64)', (column) => column.notNull())
    .addColumn('updated_at', 'varchar(40)', (column) => column.notNull())
    .execute()
}
