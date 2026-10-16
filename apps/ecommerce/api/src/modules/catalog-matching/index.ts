export { deterministicCatalogMatch } from "./catalog-matching.domain.js";
export {
  catalogMatchingMigration,
  catalogMatchingUuidWidthMigration,
  migrateCatalogMatchingModule,
  upgradeCatalogMatchingUuidWidth
} from "./catalog-matching.migration.js";
export { catalogMatchingModule } from "./catalog-matching.module.js";
export {
  CatalogMatchingOutboxRelay,
  startCatalogMatchingOutboxRelay,
  type CatalogMatchQueuePort
} from "./catalog-matching.outbox.js";
export { seedCatalogMatchingModule } from "./catalog-matching.seed.js";
export {
  processSemanticCatalogMatch,
  semanticCatalogMatchJobName
} from "./catalog-matching.worker.js";
export type * from "./catalog-matching.types.js";
