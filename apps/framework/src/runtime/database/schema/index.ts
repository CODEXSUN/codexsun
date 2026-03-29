import { auditSupportSection } from "./sections/08-audit-support.js"
import { authControlSection } from "./sections/04-auth-control.js"
import { companiesSection } from "./sections/02-companies.js"
import { companyCustomizationSection } from "./sections/03-company-customization.js"
import { databaseManagementSection } from "./sections/07-database-management.js"
import { deploymentUpdatesSection } from "./sections/06-deployment-updates.js"
import { mediaStorageSection } from "./sections/05-media-storage.js"
import { systemRuntimeSection } from "./sections/01-system-runtime.js"

import type { DatabaseFoundationSection, DatabaseFoundationTable } from "./types.js"

export const frameworkFoundationSections: DatabaseFoundationSection[] = [
  systemRuntimeSection,
  companiesSection,
  companyCustomizationSection,
  authControlSection,
  mediaStorageSection,
  deploymentUpdatesSection,
  databaseManagementSection,
  auditSupportSection,
]

export function listFoundationTables() {
  return frameworkFoundationSections.flatMap((section) => section.tables)
}

export function findFoundationSection(key: string) {
  return frameworkFoundationSections.find((section) => section.key === key) ?? null
}

export function findFoundationTable(name: string): DatabaseFoundationTable | null {
  return listFoundationTables().find((table) => table.name === name) ?? null
}

export type { DatabaseFoundationSection, DatabaseFoundationTable } from "./types.js"
