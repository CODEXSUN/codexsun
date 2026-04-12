import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import {
  companyBrandProfileResponseSchema,
  companyResponseSchema,
  companySchema,
  defaultCompanyBrandAssetDesigner,
  companyUpsertPayloadSchema,
  companyListResponseSchema,
  type Company,
  type CompanyBrandProfileResponse,
  type CompanyResponse,
  type CompanyListResponse,
} from "../../shared/index.js"
import { getPublishedBrandAssetPublicUrl } from "./company-brand-assets-service.js"
import { deleteCompanyBrandAssetDraft } from "./company-brand-asset-draft-service.js"

import { cxappTableNames } from "../../database/table-names.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"

function normalizeLegacyAddressTypeId(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  switch (value.trim().toLowerCase()) {
    case "billing":
      return "address-type:billing"
    case "shipping":
      return "address-type:shipping"
    case "office":
    case "head-office":
    case "head_office":
      return "address-type:office"
    case "branch":
    case "warehouse":
    case "hub":
    case "studio":
      return "address-type:branch"
    case "home":
    case "primary":
      return "address-type:primary-1"
    default:
      return null
  }
}

async function readCompanies(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Company>(database, cxappTableNames.companies)

  return items
    .map((company) =>
      companySchema.parse({
        ...company,
        shortAbout: company.shortAbout ?? null,
        longAbout: company.longAbout ?? null,
        isPrimary: company.isPrimary ?? false,
        brandAssetDesigner: {
          ...defaultCompanyBrandAssetDesigner,
          ...(company.brandAssetDesigner ?? {}),
          primary: {
            ...defaultCompanyBrandAssetDesigner.primary,
            ...(company.brandAssetDesigner?.primary ?? {}),
          },
          dark: {
            ...defaultCompanyBrandAssetDesigner.dark,
            ...(company.brandAssetDesigner?.dark ?? {}),
          },
          favicon: {
            ...defaultCompanyBrandAssetDesigner.favicon,
            ...(company.brandAssetDesigner?.favicon ?? {}),
          },
          print: {
            ...defaultCompanyBrandAssetDesigner.print,
            ...(company.brandAssetDesigner?.print ?? {}),
          },
        },
        addresses: (company.addresses ?? []).map((address) => ({
          ...address,
          addressTypeId:
            address.addressTypeId ?? normalizeLegacyAddressTypeId((address as { addressType?: unknown }).addressType),
          districtId: address.districtId ?? null,
        })),
      })
    )
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function writeCompanies(database: Kysely<unknown>, companies: Company[]) {
  await replaceJsonStoreRecords(
    database,
    cxappTableNames.companies,
    companies.map((company, index) => ({
      id: company.id,
      moduleKey: "companies",
      sortOrder: index + 1,
      payload: company,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }))
  )
}

function ensurePrimaryCompany(companies: Company[]) {
  if (companies.some((company) => company.isPrimary)) {
    return companies
  }

  const fallbackCompany =
    companies.find((company) => company.isActive) ??
    companies[0] ??
    null

  if (!fallbackCompany) {
    return companies
  }

  return companies.map((company) => ({
    ...company,
    isPrimary: company.id === fallbackCompany.id,
  }))
}

function applyPrimaryCompanySelection(companies: Company[], primaryCompanyId: string | null) {
  if (!primaryCompanyId) {
    return ensurePrimaryCompany(companies)
  }

  return companies.map((company) => ({
    ...company,
    isPrimary: company.id === primaryCompanyId,
  }))
}

function buildCompanyRecord(
  payload: ReturnType<typeof companyUpsertPayloadSchema.parse>,
  existing?: Company
) {
  const timestamp = new Date().toISOString()
  const companyId = existing?.id ?? `company:${randomUUID()}`
  const primaryEmail = payload.emails[0]?.email && payload.emails[0].email !== "-"
    ? payload.emails[0].email
    : null
  const primaryPhone =
    payload.phones[0]?.phoneNumber && payload.phones[0].phoneNumber !== "-"
      ? payload.phones[0].phoneNumber
      : null

  return companySchema.parse({
    id: companyId,
    name: payload.name,
    legalName: payload.legalName === "-" ? null : payload.legalName,
    tagline: payload.tagline === "-" ? null : payload.tagline,
    shortAbout: payload.shortAbout === "-" ? null : payload.shortAbout,
    longAbout: payload.longAbout === "-" ? null : payload.longAbout,
    registrationNumber:
      payload.registrationNumber === "-" ? null : payload.registrationNumber,
    pan: payload.pan === "-" ? null : payload.pan,
    financialYearStart:
      payload.financialYearStart === "-" ? null : payload.financialYearStart,
    booksStart: payload.booksStart === "-" ? null : payload.booksStart,
    website: payload.website === "-" ? null : payload.website,
    description: payload.description === "-" ? null : payload.description,
    facebookUrl: payload.facebookUrl === "-" ? null : payload.facebookUrl,
    twitterUrl: payload.twitterUrl === "-" ? null : payload.twitterUrl,
    instagramUrl: payload.instagramUrl === "-" ? null : payload.instagramUrl,
    youtubeUrl: payload.youtubeUrl === "-" ? null : payload.youtubeUrl,
    primaryEmail,
    primaryPhone,
    isPrimary: payload.isPrimary,
    isActive: payload.isActive,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    logos: payload.logos.map((item, index) => ({
      id: existing?.logos[index]?.id ?? `company-logo:${randomUUID()}`,
      companyId,
      logoUrl: item.logoUrl,
      logoType: item.logoType,
      isActive: payload.isActive,
      createdAt: existing?.logos[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    addresses: payload.addresses.map((item, index) => ({
      id: existing?.addresses[index]?.id ?? `company-address:${randomUUID()}`,
      companyId,
      addressTypeId: item.addressTypeId === "1" ? null : item.addressTypeId,
      addressLine1: item.addressLine1,
      addressLine2: item.addressLine2 === "-" ? null : item.addressLine2,
      cityId: item.cityId === "1" ? null : item.cityId,
      districtId: item.districtId === "1" ? null : item.districtId,
      stateId: item.stateId === "1" ? null : item.stateId,
      countryId: item.countryId === "1" ? null : item.countryId,
      pincodeId: item.pincodeId === "1" ? null : item.pincodeId,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      isDefault: item.isDefault,
      isActive: payload.isActive,
      createdAt: existing?.addresses[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    emails: payload.emails.map((item, index) => ({
      id: existing?.emails[index]?.id ?? `company-email:${randomUUID()}`,
      companyId,
      email: item.email,
      emailType: item.emailType,
      isActive: payload.isActive,
      createdAt: existing?.emails[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    phones: payload.phones.map((item, index) => ({
      id: existing?.phones[index]?.id ?? `company-phone:${randomUUID()}`,
      companyId,
      phoneNumber: item.phoneNumber,
      phoneType: item.phoneType,
      isPrimary: item.isPrimary,
      isActive: payload.isActive,
      createdAt: existing?.phones[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    bankAccounts: payload.bankAccounts.map((item, index) => ({
      id: existing?.bankAccounts[index]?.id ?? `company-bank:${randomUUID()}`,
      companyId,
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      accountHolderName: item.accountHolderName,
      ifsc: item.ifsc,
      branch: item.branch === "-" ? null : item.branch,
      isPrimary: item.isPrimary,
      isActive: payload.isActive,
      createdAt: existing?.bankAccounts[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    brandAssetDesigner: existing?.brandAssetDesigner ?? payload.brandAssetDesigner,
  })
}

export async function listCompanies(
  database: Kysely<unknown>
): Promise<CompanyListResponse> {
  return companyListResponseSchema.parse({
    items: ensurePrimaryCompany(await readCompanies(database)),
  })
}

export async function getCompany(
  database: Kysely<unknown>,
  _user: AuthUser,
  companyId: string
): Promise<CompanyResponse> {
  const companies = ensurePrimaryCompany(await readCompanies(database))
  const company = companies.find((item) => item.id === companyId)

  if (!company) {
    throw new ApplicationError("Company could not be found.", { companyId }, 404)
  }

  return companyResponseSchema.parse({
    item: company,
  })
}

export async function createCompany(
  database: Kysely<unknown>,
  _user: AuthUser,
  payload: unknown
): Promise<CompanyResponse> {
  const parsedPayload = companyUpsertPayloadSchema.parse(payload)
  const companies = ensurePrimaryCompany(await readCompanies(database))

  if (
    companies.some(
      (company) =>
        company.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Company name already exists.", { name: parsedPayload.name }, 409)
  }

  const record = buildCompanyRecord(parsedPayload)
  const nextCompanies = applyPrimaryCompanySelection(
    [...companies, record],
    record.isPrimary ? record.id : null
  )
  await writeCompanies(database, nextCompanies)
  const resolvedRecord = nextCompanies.find((item) => item.id === record.id) ?? record

  return companyResponseSchema.parse({
    item: resolvedRecord,
  })
}

export async function updateCompany(
  database: Kysely<unknown>,
  _user: AuthUser,
  companyId: string,
  payload: unknown
): Promise<CompanyResponse> {
  const parsedPayload = companyUpsertPayloadSchema.parse(payload)
  const companies = ensurePrimaryCompany(await readCompanies(database))
  const existing = companies.find((item) => item.id === companyId)

  if (!existing) {
    throw new ApplicationError("Company could not be found.", { companyId }, 404)
  }

  if (
    companies.some(
      (company) =>
        company.id !== companyId &&
        company.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Company name already exists.", { name: parsedPayload.name }, 409)
  }

  const updated = buildCompanyRecord(parsedPayload, existing)
  const nextCompanies = applyPrimaryCompanySelection(
    companies.map((item) => (item.id === companyId ? updated : item)),
    updated.isPrimary ? updated.id : companies.find((item) => item.isPrimary && item.id !== companyId)?.id ?? null
  )
  await writeCompanies(database, nextCompanies)

  const resolvedUpdated = nextCompanies.find((item) => item.id === companyId) ?? updated

  return companyResponseSchema.parse({
    item: resolvedUpdated,
  })
}

export async function deleteCompany(
  database: Kysely<unknown>,
  _user: AuthUser,
  companyId: string
) {
  const companies = ensurePrimaryCompany(await readCompanies(database))
  const nextCompanies = ensurePrimaryCompany(companies.filter((item) => item.id !== companyId))

  if (nextCompanies.length === companies.length) {
    throw new ApplicationError("Company could not be found.", { companyId }, 404)
  }

  await writeCompanies(database, nextCompanies)
  await deleteCompanyBrandAssetDraft(database, companyId)

  return {
    deleted: true as const,
    id: companyId,
  }
}

export async function getPrimaryCompanyBrandProfile(
  database: Kysely<unknown>,
  config: ServerConfig
): Promise<CompanyBrandProfileResponse> {
  const companies = ensurePrimaryCompany(await readCompanies(database))
  const company = companies.find((item) => item.isPrimary) ?? companies[0] ?? null

  if (!company) {
    throw new ApplicationError("Primary company brand profile is unavailable.", {}, 404)
  }

  const primaryLogo =
    company.logos.find((logo) => logo.logoType.trim().toLowerCase() === "primary") ??
    company.logos[0] ??
    null
  const primaryAddress =
    company.addresses.find((address) => address.isDefault) ??
    company.addresses[0] ??
    null
  const companyLogoUrl = primaryLogo?.logoUrl ?? null
  const publishedLogoUrl = await getPublishedBrandAssetPublicUrl(config, "primary")
  const publishedDarkLogoUrl = await getPublishedBrandAssetPublicUrl(config, "dark")
  const resolvedLogoUrl = publishedLogoUrl ?? companyLogoUrl
  const resolvedDarkLogoUrl = publishedDarkLogoUrl ?? resolvedLogoUrl

  return companyBrandProfileResponseSchema.parse({
    item: {
      companyId: company.id,
      brandName: company.name,
      legalName: company.legalName,
      tagline: company.tagline,
      shortAbout: company.shortAbout,
      longAbout: company.longAbout,
      website: company.website,
      primaryEmail: company.primaryEmail,
      primaryPhone: company.primaryPhone,
      logoUrl: resolvedLogoUrl,
      darkLogoUrl: resolvedDarkLogoUrl,
      companyLogoUrl,
      logoSource:
        publishedLogoUrl ? "published"
        : companyLogoUrl ? "company"
        : "none",
      addressLine1: primaryAddress?.addressLine1 ?? null,
      addressLine2: primaryAddress?.addressLine2 ?? null,
    },
  })
}
