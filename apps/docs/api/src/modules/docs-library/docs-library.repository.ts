import type { Kysely } from 'kysely'
import type { DocsDatabase } from '../../database.js'
import { migrateDocsLibrary } from './docs-library.migration.js'
import type { DocumentRecord } from './docs-library.types.js'

export class DocsIndexRepository {
  public constructor(private readonly database: Kysely<DocsDatabase>) {}

  public async migrate(): Promise<void> {
    await migrateDocsLibrary(this.database)
  }

  public async replace(documents: DocumentRecord[]): Promise<void> {
    for (const document of documents) {
      await this.database
        .insertInto('docs_documents')
        .values({
          aliases_json: JSON.stringify(document.aliases),
          description: document.description,
          links_json: JSON.stringify(document.links),
          slug: document.slug,
          source_hash: document.sourceHash,
          source_path: document.path,
          tags_json: JSON.stringify(document.tags),
          title: document.title,
          updated_at: document.updatedAt,
        })
        .onDuplicateKeyUpdate({
          aliases_json: JSON.stringify(document.aliases),
          description: document.description,
          links_json: JSON.stringify(document.links),
          source_hash: document.sourceHash,
          source_path: document.path,
          tags_json: JSON.stringify(document.tags),
          title: document.title,
          updated_at: document.updatedAt,
        })
        .execute()
    }
  }
}
