import { DocumentIndex, type IndexSyncResult } from "../repository/document-index.js";
import { discoverDocuments, resolveInsideRoot } from "./document-source.js";

export interface DocumentCatalogConfiguration {
  readonly indexPath: string;
  readonly repositoryRoot: string;
}

export class DocumentCatalog {
  private readonly index: DocumentIndex;
  private readonly repositoryRoot: string;

  constructor(configuration: DocumentCatalogConfiguration) {
    this.repositoryRoot = resolveInsideRoot(configuration.repositoryRoot, ".");
    this.index = new DocumentIndex(resolveInsideRoot(this.repositoryRoot, configuration.indexPath));
  }

  sync(): IndexSyncResult {
    return this.index.sync(discoverDocuments(this.repositoryRoot));
  }

  close(): void {
    this.index.close();
  }
}
