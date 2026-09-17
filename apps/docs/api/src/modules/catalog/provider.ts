import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";
import { DocumentCatalog } from "./service/document-catalog.js";

export interface DocsCatalogConfiguration {
  readonly indexPath: string;
  readonly repositoryRoot: string;
}

export class DocsCatalogProvider implements ModuleProvider {
  private readonly catalog?: DocumentCatalog;

  constructor(configuration?: DocsCatalogConfiguration) {
    this.catalog = configuration ? new DocumentCatalog(configuration) : undefined;
  }

  readonly manifest = {
    id: "docs.catalog",
    owner: "apps/docs/api/modules/catalog",
    version: "1.0.9",
    dependencies: ["platform.core"],
    contracts: ["docs.health"],
  };

  register(context: ProviderRegistrationContext): void {
    context.provide("docs.catalog", { name: "Docs Catalog" });
    if (this.catalog) context.provide("docs.catalog.service", this.catalog);
  }

  start(): void {
    this.catalog?.sync();
  }

  stop(): void {
    this.catalog?.close();
  }
}
