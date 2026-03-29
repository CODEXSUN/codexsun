import { auditSupportMigrationSection } from "./sections/08-audit-support.js"
import { authControlMigrationSection } from "./sections/04-auth-control.js"
import { companiesMigrationSection } from "./sections/02-companies.js"
import { companyCustomizationMigrationSection } from "./sections/03-company-customization.js"
import { databaseManagementMigrationSection } from "./sections/07-database-management.js"
import { deploymentUpdatesMigrationSection } from "./sections/06-deployment-updates.js"
import { mediaStorageMigrationSection } from "./sections/05-media-storage.js"
import { systemRuntimeMigrationSection } from "./sections/01-system-runtime.js"

import type { DatabaseMigrationSection } from "../../types.js"

export const platformMigrationSections: DatabaseMigrationSection[] = [
  systemRuntimeMigrationSection,
  companiesMigrationSection,
  companyCustomizationMigrationSection,
  authControlMigrationSection,
  mediaStorageMigrationSection,
  deploymentUpdatesMigrationSection,
  databaseManagementMigrationSection,
  auditSupportMigrationSection,
]

export type { DatabaseMigrationSection } from "../../types.js"
