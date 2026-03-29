import type { DatabaseMigrationSection } from "../../../types.js"

export const companyCustomizationMigrationSection: DatabaseMigrationSection = {
  key: "platform-03-company-customization",
  order: 3,
  moduleKey: "platform",
  schemaSectionKey: "company-customization",
  name: "Company Customization And Frontend Control",
  tableNames: [
    "companies_settings",
    "companies_features",
    "companies_profiles",
    "companies_brand_assets",
    "companies_social_links",
  ],
}
