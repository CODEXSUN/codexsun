import {
  companyBrandProfileSchema,
  type CompanyBrandProfile,
} from "../../../../cxapp/shared/index.js"

const runtimeBrandStorageKey = "codexsun.runtime.brand-profile"

type RuntimeBrandStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function getRuntimeBrandStorage(): RuntimeBrandStorage | null {
  const storageHost = globalThis as typeof globalThis & {
    localStorage?: RuntimeBrandStorage
  }

  return storageHost.localStorage ?? null
}

export const fallbackRuntimeBrandProfile: CompanyBrandProfile =
  companyBrandProfileSchema.parse({
    companyId: "company:codexsun",
    brandName: "Codexsun Commerce",
    legalName: "Codexsun Commerce Private Limited",
    tagline: "Suite-first commerce and operations software.",
    shortAbout: "Connected business software for billing, commerce, and operations.",
    longAbout:
      "Codexsun Commerce operates the shared business software stack for billing, ecommerce, ERP masters, and operational workflows across the suite.",
    website: "https://codexsun.example.com",
    primaryEmail: "hello@codexsun.example.com",
    primaryPhone: "+91 90000 00001",
    logoUrl: null,
    darkLogoUrl: null,
    companyLogoUrl: null,
    logoSource: "none",
    addressLine1: null,
    addressLine2: null,
  })

export function readStoredRuntimeBrandProfile() {
  const storage = getRuntimeBrandStorage()

  if (!storage) {
    return null
  }

  const storedValue = storage.getItem(runtimeBrandStorageKey)

  if (!storedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    const parsedBrand = companyBrandProfileSchema.safeParse(parsedValue)

    return parsedBrand.success ? parsedBrand.data : null
  } catch {
    return null
  }
}

export function persistRuntimeBrandProfile(
  brand: CompanyBrandProfile | null | undefined
) {
  const storage = getRuntimeBrandStorage()

  if (!storage) {
    return
  }

  if (!brand) {
    storage.removeItem(runtimeBrandStorageKey)
    return
  }

  storage.setItem(runtimeBrandStorageKey, JSON.stringify(brand))
}

export function resolveInitialRuntimeBrandProfile() {
  return readStoredRuntimeBrandProfile() ?? fallbackRuntimeBrandProfile
}
