export { productInformationModule } from "./product-information.module.js";
export {
  productInformationDetailsMigration,
  productInformationMigration,
  migrateProductInformationModule,
  upgradeProductInformationDetails
} from "./product-information.migration.js";
export { seedProductInformationModule } from "./product-information.seed.js";
export type {
  CoreBrandOption,
  CoreProductOption,
  ProductInformationFilters,
  ProductInformationRecord,
  ProductInformationSaveInput,
  PublicationStatus
} from "./product-information.types.js";
