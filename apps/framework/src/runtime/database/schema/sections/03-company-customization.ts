import type { DatabaseFoundationSection } from "../types.js"

export const companyCustomizationSection: DatabaseFoundationSection = {
  key: "company-customization",
  order: 3,
  name: "Company Customization And Frontend Control",
  purpose: "Captures per-company settings, features, profiles, and brand identity assets.",
  tables: [
    { key: "companies_settings", name: "companies_settings", purpose: "Per-company settings and scoped values." },
    { key: "companies_features", name: "companies_features", purpose: "Per-company feature toggles." },
    { key: "companies_profiles", name: "companies_profiles", purpose: "Frontend identity and profile text." },
    { key: "companies_brand_assets", name: "companies_brand_assets", purpose: "Brand asset mapping for surfaces." },
    { key: "companies_social_links", name: "companies_social_links", purpose: "Public social and profile links." },
  ],
}
