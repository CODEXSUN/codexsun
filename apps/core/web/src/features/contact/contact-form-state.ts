import type {
  CommonModuleKey,
  Contact,
  ContactAddressInput,
  ContactBankAccountInput,
  ContactEmailInput,
  ContactGstDetailInput,
  ContactPhoneInput,
  ContactUpsertPayload,
} from "@core/shared"

export type ContactFormValues = ContactUpsertPayload
export type ContactLookupModuleKey = Extract<
  CommonModuleKey,
  "contactTypes" | "addressTypes" | "countries" | "states" | "districts" | "cities" | "pincodes"
>

export type LocalOption = {
  label: string
  value: string
}

export const contactEmailTypeOptions: LocalOption[] = [
  { value: "primary", label: "Primary" },
  { value: "billing", label: "Billing" },
  { value: "support", label: "Support" },
  { value: "personal", label: "Personal" },
]

export const contactPhoneTypeOptions: LocalOption[] = [
  { value: "mobile", label: "Mobile" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "office", label: "Office" },
]

export const contactMsmeTypeOptions: LocalOption[] = [
  { value: "-", label: "-" },
  { value: "micro", label: "Micro" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
]

export const contactBalanceTypeOptions: LocalOption[] = [
  { value: "-", label: "-" },
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Credit" },
]

export function createEmptyContactAddress(): ContactAddressInput {
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

export function createEmptyContactEmail(): ContactEmailInput {
  return { email: "", emailType: "primary", isPrimary: true }
}

export function createEmptyContactPhone(): ContactPhoneInput {
  return { phoneNumber: "", phoneType: "mobile", isPrimary: true }
}

export function createEmptyContactBank(): ContactBankAccountInput {
  return {
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifsc: "",
    branch: "",
    isPrimary: true,
  }
}

export function createEmptyContactGst(): ContactGstDetailInput {
  return { gstin: "", state: "", isDefault: true }
}

export function createDefaultContactFormValues(): ContactFormValues {
  return {
    contactTypeId: "1",
    ledgerId: null,
    ledgerName: null,
    name: "",
    legalName: "",
    pan: "",
    gstin: "",
    msmeType: "-",
    msmeNo: "",
    openingBalance: 0,
    balanceType: "-",
    creditLimit: 0,
    website: "",
    description: "",
    isActive: true,
    addresses: [createEmptyContactAddress()],
    emails: [createEmptyContactEmail()],
    phones: [createEmptyContactPhone()],
    bankAccounts: [createEmptyContactBank()],
    gstDetails: [createEmptyContactGst()],
  }
}

export function toContactFormValues(contact: Contact): ContactFormValues {
  return {
    contactTypeId: contact.contactTypeId ?? "1",
    ledgerId: contact.ledgerId ?? null,
    ledgerName: contact.ledgerName ?? null,
    name: contact.name,
    legalName: contact.legalName ?? "",
    pan: contact.pan ?? "",
    gstin: contact.gstin ?? "",
    msmeType: contact.msmeType ?? "-",
    msmeNo: contact.msmeNo ?? "",
    openingBalance: contact.openingBalance,
    balanceType: contact.balanceType ?? "-",
    creditLimit: contact.creditLimit,
    website: contact.website ?? "",
    description: contact.description ?? "",
    isActive: contact.isActive,
    addresses: contact.addresses.length
      ? contact.addresses.map((entry) => ({
          addressTypeId: entry.addressTypeId ?? "1",
          addressLine1: entry.addressLine1,
          addressLine2: entry.addressLine2 ?? "",
          cityId: entry.cityId ?? "1",
          districtId: entry.districtId ?? "1",
          stateId: entry.stateId ?? "1",
          countryId: entry.countryId ?? "1",
          pincodeId: entry.pincodeId ?? "1",
          latitude: entry.latitude,
          longitude: entry.longitude,
          isDefault: entry.isDefault,
        }))
      : [createEmptyContactAddress()],
    emails: contact.emails.length
      ? contact.emails.map((entry) => ({
          email: entry.email,
          emailType: entry.emailType,
          isPrimary: entry.isPrimary,
        }))
      : [createEmptyContactEmail()],
    phones: contact.phones.length
      ? contact.phones.map((entry) => ({
          phoneNumber: entry.phoneNumber,
          phoneType: entry.phoneType,
          isPrimary: entry.isPrimary,
        }))
      : [createEmptyContactPhone()],
    bankAccounts: contact.bankAccounts.length
      ? contact.bankAccounts.map((entry) => ({
          bankName: entry.bankName,
          accountNumber: entry.accountNumber,
          accountHolderName: entry.accountHolderName,
          ifsc: entry.ifsc,
          branch: entry.branch ?? "",
          isPrimary: entry.isPrimary,
        }))
      : [createEmptyContactBank()],
    gstDetails: contact.gstDetails.length
      ? contact.gstDetails.map((entry) => ({
          gstin: entry.gstin,
          state: entry.state,
          isDefault: entry.isDefault,
        }))
      : [createEmptyContactGst()],
  }
}
