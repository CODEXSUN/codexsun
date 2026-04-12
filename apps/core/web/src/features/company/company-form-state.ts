import type {
  CommonModuleKey,
} from "@core/shared"
import type {
  Company,
  CompanyAddressInput,
  CompanyBrandAssetDesigner,
  CompanyBankAccountInput,
  CompanyEmailInput,
  CompanyLogoInput,
  CompanyPhoneInput,
  CompanyUpsertPayload,
} from "@cxapp/shared"
import { defaultCompanyBrandAssetDesigner } from "@cxapp/shared"

export type CompanyFormValues = CompanyUpsertPayload
export type CompanyLocationModuleKey = Extract<
  CommonModuleKey,
  "addressTypes" | "countries" | "states" | "districts" | "cities" | "pincodes"
>

export type LocalOption = {
  label: string
  value: string
}

export const companyEmailTypeOptions: LocalOption[] = [
  { value: "admin", label: "Admin" },
  { value: "billing", label: "Billing" },
  { value: "support", label: "Support" },
  { value: "sales", label: "Sales" },
]

export const companyPhoneTypeOptions: LocalOption[] = [
  { value: "phone", label: "Phone" },
  { value: "mobile", label: "Mobile" },
  { value: "office", label: "Office" },
  { value: "whatsapp", label: "WhatsApp" },
]

export function createEmptyCompanyLogo(): CompanyLogoInput {
  return { logoType: "primary", logoUrl: "" }
}

export function createEmptyCompanyAddress(): CompanyAddressInput {
  return {
    addressTypeId: "1",
    addressLine1: "",
    addressLine2: "",
    cityId: "1",
    districtId: "1",
    stateId: "1",
    countryId: "1",
    pincodeId: "1",
    latitude: null,
    longitude: null,
    isDefault: true,
  }
}

export function createEmptyCompanyEmail(): CompanyEmailInput {
  return { email: "", emailType: "admin" }
}

export function createEmptyCompanyPhone(): CompanyPhoneInput {
  return { isPrimary: true, phoneNumber: "", phoneType: "phone" }
}

export function createEmptyCompanyBankAccount(): CompanyBankAccountInput {
  return {
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
    ifsc: "",
    isPrimary: true,
  }
}

export function createDefaultCompanyFormValues(): CompanyFormValues {
  return {
    name: "",
    legalName: "",
    tagline: "",
    shortAbout: "",
    longAbout: "",
    registrationNumber: "",
    pan: "",
    financialYearStart: "",
    booksStart: "",
    website: "",
    description: "",
    facebookUrl: "",
    twitterUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    isPrimary: false,
    isActive: true,
    logos: [],
    addresses: [createEmptyCompanyAddress()],
    emails: [createEmptyCompanyEmail()],
    phones: [createEmptyCompanyPhone()],
    bankAccounts: [createEmptyCompanyBankAccount()],
    brandAssetDesigner: structuredClone(defaultCompanyBrandAssetDesigner) as CompanyBrandAssetDesigner,
  }
}

export function toCompanyFormValues(company: Company): CompanyFormValues {
  return {
    name: company.name,
    legalName: company.legalName ?? "",
    tagline: company.tagline ?? "",
    shortAbout: company.shortAbout ?? "",
    longAbout: company.longAbout ?? "",
    registrationNumber: company.registrationNumber ?? "",
    pan: company.pan ?? "",
    financialYearStart: company.financialYearStart ?? "",
    booksStart: company.booksStart ?? "",
    website: company.website ?? "",
    description: company.description ?? "",
    facebookUrl: company.facebookUrl ?? "",
    twitterUrl: company.twitterUrl ?? "",
    instagramUrl: company.instagramUrl ?? "",
    youtubeUrl: company.youtubeUrl ?? "",
    isPrimary: company.isPrimary,
    isActive: company.isActive,
    logos: company.logos.map((logo) => ({
      logoType: logo.logoType,
      logoUrl: logo.logoUrl,
    })),
    addresses: company.addresses.length
      ? company.addresses.map((address) => ({
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2 ?? "",
          addressTypeId: address.addressTypeId ?? "1",
          cityId: address.cityId ?? "1",
          districtId: address.districtId ?? "1",
          stateId: address.stateId ?? "1",
          countryId: address.countryId ?? "1",
          pincodeId: address.pincodeId ?? "1",
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: address.isDefault,
        }))
      : [createEmptyCompanyAddress()],
    emails: company.emails.length
      ? company.emails.map((email) => ({
          email: email.email,
          emailType: email.emailType,
        }))
      : [createEmptyCompanyEmail()],
    phones: company.phones.length
      ? company.phones.map((phone) => ({
          isPrimary: phone.isPrimary,
          phoneNumber: phone.phoneNumber,
          phoneType: phone.phoneType,
        }))
      : [createEmptyCompanyPhone()],
    bankAccounts: company.bankAccounts.length
      ? company.bankAccounts.map((account) => ({
          accountHolderName: account.accountHolderName,
          accountNumber: account.accountNumber,
          bankName: account.bankName,
          branch: account.branch ?? "",
          ifsc: account.ifsc,
          isPrimary: account.isPrimary,
        }))
      : [createEmptyCompanyBankAccount()],
    brandAssetDesigner: company.brandAssetDesigner,
  }
}
