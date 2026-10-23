export { brandModule } from "./brand.module.js";
export { migrateBrand } from "./brand.migration.js";
export { seedBrand } from "./brand.seed.js";
export { lookupBrand, BrandService } from "./brand.service.js";
export { brandInputSchema, brandRecordSchema } from "./brand.routes.js";
export type { BrandInput, BrandRecord } from "./brand.types.js";

export { upgradeBrandIntegrity } from "./brand.migration.js";
