export * from "./modules/mail/index.js";
export {
  migrateMailSuppressions,
  seedMailSafetyPermissions,
  recordMailSuppression,
  checkMailSuppression,
  registerMailSuppressionRoutes
} from "./modules/suppression/index.js";

import { migrateMailModule as migrateMailFoundation } from "./modules/mail/index.js";
import { seedMailModule as seedMailFoundation } from "./modules/mail/index.js";
import { migrateMailSuppressions, seedMailSafetyPermissions } from "./modules/suppression/index.js";
import type { MailSafetyContext } from "./modules/suppression/index.js";
export async function migrateMailModule(database: MailSafetyContext["database"]) {
  await migrateMailFoundation(database);
  await migrateMailSuppressions(database);
}
export async function seedMailModule(database: MailSafetyContext["database"]) {
  await seedMailSafetyPermissions(database);
  return seedMailFoundation(database);
}
