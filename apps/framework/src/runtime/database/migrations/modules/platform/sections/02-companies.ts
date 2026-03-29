import type { DatabaseMigrationSection } from "../../../types.js"

export const companiesMigrationSection: DatabaseMigrationSection = {
  key: "platform-02-companies",
  order: 2,
  moduleKey: "platform",
  schemaSectionKey: "companies",
  name: "Companies As Client Root",
  tableNames: [
    "companies",
    "companies_branches",
    "companies_addresses",
    "companies_emails",
    "companies_phones",
    "companies_bank_accounts",
    "companies_domains",
    "companies_surfaces",
  ],
}
