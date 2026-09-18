import type { DocumentationScanResponse, DocumentSummary, DocumentUpdateRequest } from "@codexsun/garments-contracts";
import type { GarmentsEnvironment } from "../../config.js";
import { GarmentsRenderer } from "./garments-library.renderer.js";
import { GarmentsIndexRepository } from "./garments-library.repository.js";
import { GarmentsVault } from "./garments-library.source.js";
import type { DocumentRecord, RenderedDocument } from "./garments-library.types.js";

export class GarmentsLibraryService {
  public constructor(
    private readonly environment: GarmentsEnvironment,
    private readonly vault: GarmentsVault,
    private readonly renderer: GarmentsRenderer,
    private readonly index: GarmentsIndexRepository,
  ) {}

  public async getDocument(slug: string): Promise<RenderedDocument | undefined> {
    const document = await this.vault.find(slug);
    if (!document) {
      return undefined;
    }

    return { ...document, html: await this.renderer.render(document) };
  }

  public async listDocuments(): Promise<DocumentSummary[]> {
    const documents = await this.vault.list();
    return documents.map(toDocumentSummary);
  }

  public getAsset(assetPath: string) {
    return this.vault.getAsset(assetPath);
  }

  public scanDocumentation(): Promise<DocumentationScanResponse> {
    return this.vault.scan();
  }

  public async updateDocument(slug: string, input: DocumentUpdateRequest): Promise<RenderedDocument | undefined> {
    const currentDocument = await this.vault.find(slug);
    if (!currentDocument) return undefined;

    const document = await this.vault.update(currentDocument, input);
    if (this.environment.GARMENTS_INDEX_MODE !== "filesystem") {
      await this.index.migrate();
      await this.index.replace(await this.vault.list());
    }
    return { ...document, html: await this.renderer.render(document) };
  }

  public async syncIndex(): Promise<number> {
    if (this.environment.GARMENTS_INDEX_MODE === "filesystem") {
      return 0;
    }

    const documents = await this.vault.list();
    await this.index.migrate();
    await this.index.replace(documents);
    return documents.length;
  }
}

function toDocumentSummary(document: DocumentRecord): DocumentSummary {
  return {
    aliases: document.aliases,
    description: document.description,
    links: document.links,
    path: document.path,
    slug: document.slug,
    tags: document.tags,
    title: document.title,
    updatedAt: document.updatedAt,
  };
}
