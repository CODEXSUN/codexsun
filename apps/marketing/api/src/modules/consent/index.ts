export { consentModule } from "./consent.module.js";
export { migrateConsent } from "./consent.migration.js";
export { seedConsent } from "./consent.seed.js";
export { ConsentService, consentInputSchema, eligibilityInputSchema } from "./consent.service.js";
export type {
  ConsentDependencies,
  ConsentInput,
  ConsentRecord,
  EligibilityInput,
  EligibilityResult
} from "./consent.types.js";
