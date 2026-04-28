import { normalizeTenantIndustryId } from "../../shared/tenant-visibility-catalog.js"

type CompanyIndustrySource = {
  id: string
  name: string
  tagline?: string | null
  shortAbout?: string | null
}

export function detectCxappIndustryId(company: CompanyIndustrySource) {
  const searchable = [
    company.id,
    company.name,
    company.tagline ?? "",
    company.shortAbout ?? "",
  ]
    .join(" ")
    .toLowerCase()

  if (searchable.includes("offset") || searchable.includes("printing") || searchable.includes("print")) {
    return "offset"
  }

  if (searchable.includes("upvc")) {
    return "upvc"
  }

  if (
    searchable.includes("computer") ||
    searchable.includes("laptop") ||
    searchable.includes("electronics") ||
    searchable.includes("tech")
  ) {
    return "computer-store-ecommerce"
  }

  if (searchable.includes("audit") || searchable.includes("accounts") || searchable.includes("ca")) {
    return "accounts-audit"
  }

  if (
    searchable.includes("ecommerce") ||
    searchable.includes("storefront") ||
    searchable.includes("d2c") ||
    searchable.includes("direct-to-consumer") ||
    searchable.includes("online")
  ) {
    return "garment-ecommerce"
  }

  return normalizeTenantIndustryId("garments")
}
