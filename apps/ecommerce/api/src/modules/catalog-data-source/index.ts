export { CatalogDataSourceService } from "./catalog-data-source.service.js";
export { registerCatalogDataSourceRoutes } from "./catalog-data-source.routes.js";
export type * from "./catalog-data-source.types.js";
export {
  catalogDataSourceCompatibilityMigration,
  catalogDataSourceSyncMigration,
  catalogModuleDataSourceMigration,
  upgradeCatalogDataSourceCompatibility
} from "./catalog-data-source.migration.js";
export const catalogDataSourceModuleKey = "ecommerce.catalog-data-source";
