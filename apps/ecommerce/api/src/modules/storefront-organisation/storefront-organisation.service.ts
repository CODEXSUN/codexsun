import { getCompanyForDatabase, getOrganisationOptionsForDatabase } from "@codexsun/core-api";
import { AppError } from "@codexsun/framework/errors";
import { getEcommerceTenantDatabaseName } from "../../database/ecommerce-database.js";
import { invalidateStorefrontReadCache } from "../storefront/index.js";
import { StorefrontOrganisationRepository } from "./storefront-organisation.repository.js";
import { StorefrontOrganisationLogoStorage } from "./storefront-organisation.storage.js";
import type { StorefrontOrganisationInput } from "./storefront-organisation.types.js";

export class StorefrontOrganisationService {
  constructor(private readonly repository = new StorefrontOrganisationRepository()) {}

  options() {
    return getOrganisationOptionsForDatabase(getEcommerceTenantDatabaseName());
  }

  async get() {
    const [saved, options] = await Promise.all([this.repository.get(), this.options()]);
    return {
      companyId: saved?.companyId ?? options.defaults?.companyId ?? null,
      financialYearId: saved?.financialYearId ?? options.defaults?.financialYearId ?? null,
      displayName: saved?.displayName ?? "",
      logoFileName: saved?.logoFileName ?? null
    };
  }

  async save(input: StorefrontOrganisationInput, actorEmail: string) {
    const options = await this.options();
    if (!options.companies.some((company) => company.id === input.companyId))
      throw AppError.validation("Select an active company from this tenant.");
    if (!options.financialYears.some((year) => year.id === input.financialYearId))
      throw AppError.validation("Select an active accounting year from this tenant.");
    if (input.logoFileName)
      await new StorefrontOrganisationLogoStorage().content(input.logoFileName);
    const saved = await this.repository.save(
      { ...input, displayName: input.displayName.trim() },
      actorEmail
    );
    invalidateStorefrontReadCache();
    return saved;
  }

  async company() {
    const settings = await this.get();
    if (!settings.companyId) return null;
    const company = await getCompanyForDatabase(
      getEcommerceTenantDatabaseName(),
      settings.companyId
    );
    return company?.isActive ? company : null;
  }

  async branding() {
    const [company, settings] = await Promise.all([this.company(), this.get()]);
    const version = encodeURIComponent(company?.updatedAt ?? "");
    const customLogo = settings.logoFileName
      ? `/api/platform/storefront/organisation-logo/${settings.logoFileName}`
      : null;
    return {
      brandName:
        settings.displayName.trim() ||
        company?.legalName?.trim() ||
        company?.name.trim() ||
        "Store",
      logoUrl:
        customLogo ||
        (company?.logoPath ? `/api/platform/storefront/company-logo/logo?v=${version}` : null),
      logoDarkUrl:
        customLogo ||
        (company?.logoDarkPath
          ? `/api/platform/storefront/company-logo/logo-dark?v=${version}`
          : null),
      primaryPhone: company?.primaryPhone ?? null
    };
  }
}
