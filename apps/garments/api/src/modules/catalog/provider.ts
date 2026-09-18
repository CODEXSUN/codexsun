import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";
import { DocumentCatalog } from "./service/document-catalog.js";

export interface GarmentsCatalogConfiguration {
  readonly indexPath: string;
  readonly repositoryRoot: string;
}

export class GarmentsCatalogProvider implements ModuleProvider {
  private readonly catalog?: DocumentCatalog;
  constructor(configuration?: GarmentsCatalogConfiguration) {
    this.catalog = configuration ? new DocumentCatalog(configuration) : undefined;
  }
  readonly manifest = {
    id: "garments.catalog",
    owner: "apps/garments/api/modules/catalog",
    version: "1.0.9",
    dependencies: ["platform.core"],
    contracts: ["garments.health"],
    events: { published: [], consumed: [] },
  };
  register(context: ProviderRegistrationContext): void {
    context.provide("garments.catalog", { name: "Garments Catalog" });
    if (this.catalog) context.provide("garments.catalog.service", this.catalog);
  }
  start(): void {
    this.catalog?.sync();
  }
  stop(): void {
    this.catalog?.close();
  }
}
