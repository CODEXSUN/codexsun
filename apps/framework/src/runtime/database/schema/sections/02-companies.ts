import type { DatabaseFoundationSection } from "../types.js"

export const companiesSection: DatabaseFoundationSection = {
  key: "companies",
  order: 2,
  name: "Companies As Client Root",
  purpose: "Defines companies and their top-level surface/domain identity.",
  tables: [
    { key: "companies", name: "companies", purpose: "Primary client root record." },
    { key: "companies_branches", name: "companies_branches", purpose: "Company branch structure." },
    { key: "companies_addresses", name: "companies_addresses", purpose: "Company address records." },
    { key: "companies_emails", name: "companies_emails", purpose: "Company email records." },
    { key: "companies_phones", name: "companies_phones", purpose: "Company phone records." },
    { key: "companies_bank_accounts", name: "companies_bank_accounts", purpose: "Company banking records." },
    { key: "companies_domains", name: "companies_domains", purpose: "Company domain and URL mapping." },
    { key: "companies_surfaces", name: "companies_surfaces", purpose: "Enabled surfaces per company." },
  ],
}
