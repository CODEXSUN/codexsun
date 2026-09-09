import type { DocumentSummary, DocumentUpdateRequest } from '@codexsun/docs-contracts'
import type { DocsEnvironment } from '../../config.js'
import { DocsRenderer } from './docs-library.renderer.js'
import { DocsIndexRepository } from './docs-library.repository.js'
import { DocsVault } from './docs-library.source.js'
import type { RenderedDocument } from './docs-library.types.js'

export class DocsLibraryService {
  public constructor(
    private readonly environment: DocsEnvironment,
    private readonly vault: DocsVault,
    private readonly renderer: DocsRenderer,
    private readonly index: DocsIndexRepository,
  ) {}

  public async getDocument(slug: string): Promise<RenderedDocument | undefined> {
    const document = await this.vault.find(slug)
    if (!document) {
      return undefined
    }

    return { ...document, html: await this.renderer.render(document) }
  }

  public async listDocuments(): Promise<DocumentSummary[]> {
    const documents = await this.vault.list()
    return documents.map(({ source, sourceHash, ...summary }) => summary)
  }

  public getAsset(assetPath: string) {
    return this.vault.getAsset(assetPath)
  }

  public async updateDocument(
    slug: string,
    input: DocumentUpdateRequest,
  ): Promise<RenderedDocument | undefined> {
    const currentDocument = await this.vault.find(slug)
    if (!currentDocument) return undefined

    const document = await this.vault.update(currentDocument, input)
    if (this.environment.DOCS_INDEX_MODE !== 'filesystem') {
      await this.index.migrate()
      await this.index.replace(await this.vault.list())
    }
    return { ...document, html: await this.renderer.render(document) }
  }

  public async syncIndex(): Promise<number> {
    if (this.environment.DOCS_INDEX_MODE === 'filesystem') {
      return 0
    }

    const documents = await this.vault.list()
    await this.index.migrate()
    await this.index.replace(documents)
    return documents.length
  }
}
