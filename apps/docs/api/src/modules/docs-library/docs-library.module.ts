import type { FastifyInstance } from 'fastify'
import { resolve } from 'node:path'
import type { Kysely } from 'kysely'
import type { DocsEnvironment } from '../../config.js'
import type { DocsDatabase } from '../../database.js'
import { DocsRenderer } from './docs-library.renderer.js'
import { DocsIndexRepository } from './docs-library.repository.js'
import { registerDocsLibraryRoutes } from './docs-library.routes.js'
import { DocsLibraryService } from './docs-library.service.js'
import { DocsVault } from './docs-library.source.js'

export const docsLibraryModuleManifest = {
  capabilities: ['obsidian-vault-reading', 'mdx-html-rendering', 'mariadb-document-indexing'],
  dependencies: {},
  id: 'docs.library.api',
  lifecycle: {
    activate: 'Registers the versioned Docs HTTP contract.',
    deactivate: 'Stops Docs route handling with the API runtime.',
    install: 'Creates the docs_documents index when an administrator requests a sync.',
    uninstall: 'Does not remove source vault files or indexed documents automatically.',
    upgrade: 'Version 0.1.0 has one additive, repeatable index migration.',
  },
  publicContracts: [
    'GET /api/docs/v1/documents',
    'GET /api/docs/v1/documents/:slug',
    'POST /api/docs/v1/index/sync',
  ],
  scope: 'docs',
  version: '0.1.0',
} as const

export async function registerDocsLibraryModule(
  server: FastifyInstance,
  environment: DocsEnvironment,
  database: Kysely<DocsDatabase>,
  projectRoot: string,
): Promise<void> {
  const vault = new DocsVault(resolve(projectRoot, environment.DOCS_VAULT_PATH), projectRoot)
  const service = new DocsLibraryService(
    environment,
    vault,
    new DocsRenderer(),
    new DocsIndexRepository(database),
  )
  await registerDocsLibraryRoutes(server, environment, service)
}
