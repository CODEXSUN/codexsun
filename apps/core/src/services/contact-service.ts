import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { AuthUser } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  contactListResponseSchema,
  contactResponseSchema,
  contactSchema,
  contactUpsertPayloadSchema,
  type Contact,
  type ContactListResponse,
  type ContactResponse,
} from "../../shared/index.js"
import { coreTableNames } from "../../database/table-names.js"

import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"

const legacyContactTypeLedgerMap = {
  "contact-type:customer": {
    ledgerId: "ledger-sundry-debtors",
    ledgerName: "Sundry Debtors",
  },
  "contact-type:registered-customer-b2b": {
    ledgerId: "ledger-sundry-debtors",
    ledgerName: "Sundry Debtors",
  },
  "contact-type:unregistered-customer-b2c": {
    ledgerId: "ledger-sundry-debtors",
    ledgerName: "Sundry Debtors",
  },
  "contact-type:supplier": {
    ledgerId: "ledger-sundry-creditors",
    ledgerName: "Sundry Creditors",
  },
} as const

function normalizeUppercase(value: string | null | undefined) {
  if (typeof value !== "string") {
    return value ?? null
  }

  return value.toUpperCase()
}

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

function normalizeContact(contact: Contact) {
  const legacyLedger =
    contact.contactTypeId &&
    contact.contactTypeId in legacyContactTypeLedgerMap
      ? legacyContactTypeLedgerMap[
          contact.contactTypeId as keyof typeof legacyContactTypeLedgerMap
        ]
      : null

  const fallbackCodePrefix =
    contact.contactTypeId === "contact-type:partner"
      ? "P"
      : contact.contactTypeId === "contact-type:supplier"
        ? "S"
        : "C"
  const fallbackCodeSource =
    typeof (contact as { code?: unknown }).code === "string" &&
    (contact as { code?: string }).code?.trim()
      ? (contact as { code?: string }).code!.trim().toUpperCase()
      : `${fallbackCodePrefix}${contact.id.replace(/[^a-z0-9]/gi, "").slice(-4).toUpperCase().padStart(4, "0")}`

  return contactSchema.parse({
    ...contact,
    code: fallbackCodeSource,
    contactTypeId: contact.contactTypeId ?? null,
    ledgerId: contact.ledgerId ?? legacyLedger?.ledgerId ?? null,
    ledgerName: contact.ledgerName ?? legacyLedger?.ledgerName ?? null,
    addresses: (contact.addresses ?? []).map((address) => ({
      ...address,
      addressTypeId:
        address.addressTypeId ?? normalizeLegacyAddressTypeId((address as { addressType?: unknown }).addressType),
      districtId: address.districtId ?? null,
    })),
  })
}

async function readContacts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Contact>(database, coreTableNames.contacts)

  return items
    .map(normalizeContact)
    .sort((left, right) => left.name.localeCompare(right.name))
}

async function writeContacts(database: Kysely<unknown>, contacts: Contact[]) {
  await replaceJsonStoreRecords(
    database,
    coreTableNames.contacts,
    contacts.map((contact, index) => ({
      id: contact.id,
      moduleKey: "contacts",
      sortOrder: index + 1,
      payload: contact,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    }))
  )
}

function buildPrimaryFields(payload: ReturnType<typeof contactUpsertPayloadSchema.parse>) {
  const primaryEmail = payload.emails.find((item) => item.isPrimary)?.email ?? null
  const primaryPhone =
    payload.phones.find((item) => item.isPrimary)?.phoneNumber ?? null

  return {
    primaryEmail: primaryEmail === "-" ? null : primaryEmail,
    primaryPhone: primaryPhone === "-" ? null : primaryPhone,
  }
}

function isMeaningfulValue(value: string) {
  return value.trim().length > 0 && value.trim() !== "-"
}

function normalizeContactInputValue(value: string) {
  return isMeaningfulValue(value) ? value.trim() : null
}

function getContactTypeCode(
  payload: ReturnType<typeof contactUpsertPayloadSchema.parse>,
  existing?: Contact
) {
  const contactTypeId = payload.contactTypeId ?? existing?.contactTypeId ?? ""

  if (contactTypeId === "contact-type:partner") {
    return "P"
  }

  if (contactTypeId === "contact-type:supplier") {
    return "S"
  }

  return "C"
}

function generateContactCode(
  contacts: Contact[],
  payload: ReturnType<typeof contactUpsertPayloadSchema.parse>,
  existing?: Contact
) {
  const requestedCode = payload.code === "-" ? "" : payload.code.trim().toUpperCase()
  if (requestedCode) {
    return requestedCode
  }

  const prefix = getContactTypeCode(payload, existing)
  let nextNumber = 1

  for (const contact of contacts) {
    if (existing && contact.id === existing.id) {
      continue
    }

    const normalizedCode = contact.code.trim().toUpperCase()
    if (!normalizedCode.startsWith(prefix)) {
      continue
    }

    const numericPart = Number.parseInt(normalizedCode.slice(prefix.length), 10)
    if (Number.isFinite(numericPart)) {
      nextNumber = Math.max(nextNumber, numericPart + 1)
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, "0")}`
}

function findDuplicateContact(
  contacts: Contact[],
  payload: ReturnType<typeof contactUpsertPayloadSchema.parse>,
  existingId?: string
) {
  const normalizedGstin =
    payload.gstin && payload.gstin !== "-" ? normalizeUppercase(payload.gstin)?.trim() : null
  const primaryPhone = payload.phones.find((item) => item.isPrimary)?.phoneNumber?.trim() ?? ""
  const normalizedPrimaryPhone = primaryPhone && primaryPhone !== "-" ? primaryPhone : null
  const normalizedName = payload.name.trim().toLowerCase()

  for (const contact of contacts) {
    if (existingId && contact.id === existingId) {
      continue
    }

    if (normalizedGstin && contact.gstin?.trim().toUpperCase() === normalizedGstin) {
      throw new ApplicationError("GSTIN already exists for another contact.", { gstin: normalizedGstin }, 409)
    }

    if (normalizedPrimaryPhone && contact.primaryPhone?.trim() === normalizedPrimaryPhone) {
      throw new ApplicationError("Mobile number already exists for another contact.", { phoneNumber: normalizedPrimaryPhone }, 409)
    }

    if (
      contact.name.trim().toLowerCase() === normalizedName &&
      !normalizedGstin &&
      !normalizedPrimaryPhone
    ) {
      throw new ApplicationError(
        "This name already exists. Enter a mobile number or GSTIN to continue.",
        { name: payload.name },
        409
      )
    }
  }
}

function buildContactRecord(
  contacts: Contact[],
  payload: ReturnType<typeof contactUpsertPayloadSchema.parse>,
  existing?: Contact
) {
  const timestamp = new Date().toISOString()
  const { primaryEmail, primaryPhone } = buildPrimaryFields(payload)
  const emails = payload.emails.filter((item) => isMeaningfulValue(item.email))
  const phones = payload.phones.filter((item) => isMeaningfulValue(item.phoneNumber))
  const addresses = payload.addresses.filter((item) => isMeaningfulValue(item.addressLine1))
  const bankAccounts = payload.bankAccounts.filter(
    (item) =>
      isMeaningfulValue(item.bankName) ||
      isMeaningfulValue(item.accountNumber) ||
      isMeaningfulValue(item.accountHolderName) ||
      isMeaningfulValue(item.ifsc) ||
      isMeaningfulValue(item.branch)
  )
  const gstDetails = payload.gstDetails.filter(
    (item) => isMeaningfulValue(item.gstin) || isMeaningfulValue(item.state)
  )

  return contactSchema.parse({
    id: existing?.id ?? `contact:${randomUUID()}`,
    uuid: existing?.uuid ?? randomUUID(),
    code: generateContactCode(contacts, payload, existing),
    contactTypeId: payload.contactTypeId === "1" ? null : payload.contactTypeId,
    ledgerId: payload.ledgerId,
    ledgerName: payload.ledgerName,
    name: payload.name,
    legalName: payload.legalName === "-" ? null : payload.legalName,
    pan: payload.pan === "-" ? null : normalizeUppercase(payload.pan),
    gstin: payload.gstin === "-" ? null : normalizeUppercase(payload.gstin),
    msmeType: payload.msmeType === "-" ? null : payload.msmeType,
    msmeNo: payload.msmeNo === "-" ? null : payload.msmeNo,
    openingBalance: payload.openingBalance,
    balanceType: payload.balanceType === "-" ? null : payload.balanceType,
    creditLimit: payload.creditLimit,
    website: payload.website === "-" ? null : payload.website,
    description: payload.description === "-" ? null : payload.description,
    primaryEmail,
    primaryPhone,
    isActive: payload.isActive,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    addresses: addresses.map((item, index) => ({
      id: existing?.addresses[index]?.id ?? `contact-address:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      addressTypeId: item.addressTypeId === "1" ? null : item.addressTypeId,
      addressLine1: item.addressLine1,
      addressLine2: normalizeContactInputValue(item.addressLine2),
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
    emails: emails.map((item, index) => ({
      id: existing?.emails[index]?.id ?? `contact-email:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      email: item.email,
      emailType: item.emailType,
      isPrimary: item.isPrimary,
      isActive: payload.isActive,
      createdAt: existing?.emails[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    phones: phones.map((item, index) => ({
      id: existing?.phones[index]?.id ?? `contact-phone:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      phoneNumber: item.phoneNumber,
      phoneType: item.phoneType,
      isPrimary: item.isPrimary,
      isActive: payload.isActive,
      createdAt: existing?.phones[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    bankAccounts: bankAccounts.map((item, index) => ({
      id: existing?.bankAccounts[index]?.id ?? `contact-bank:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      accountHolderName: item.accountHolderName,
      ifsc: item.ifsc,
      branch: normalizeContactInputValue(item.branch),
      isPrimary: item.isPrimary,
      isActive: payload.isActive,
      createdAt: existing?.bankAccounts[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    gstDetails: gstDetails.map((item, index) => ({
      id: existing?.gstDetails[index]?.id ?? `contact-gst:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      gstin: normalizeUppercase(item.gstin) ?? "",
      state: item.state,
      isDefault: item.isDefault,
      isActive: payload.isActive,
      createdAt: existing?.gstDetails[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
  })
}

export async function listContacts(
  database: Kysely<unknown>
): Promise<ContactListResponse> {
  return contactListResponseSchema.parse({
    items: await readContacts(database),
  })
}

export async function getContact(
  database: Kysely<unknown>,
  _user: AuthUser,
  contactId: string
): Promise<ContactResponse> {
  const contacts = await readContacts(database)
  const contact = contacts.find((item) => item.id === contactId)

  if (!contact) {
    throw new ApplicationError("Contact could not be found.", { contactId }, 404)
  }

  return contactResponseSchema.parse({
    item: contact,
  })
}

export async function createContact(
  database: Kysely<unknown>,
  _user: AuthUser,
  payload: unknown
): Promise<ContactResponse> {
  const parsedPayload = contactUpsertPayloadSchema.parse(payload)
  const contacts = await readContacts(database)

  findDuplicateContact(contacts, parsedPayload)

  let record = buildContactRecord(contacts, parsedPayload)
  record = contactSchema.parse({
    ...record,
    addresses: record.addresses.map((item) => ({ ...item, contactId: record.id })),
    emails: record.emails.map((item) => ({ ...item, contactId: record.id })),
    phones: record.phones.map((item) => ({ ...item, contactId: record.id })),
    bankAccounts: record.bankAccounts.map((item) => ({ ...item, contactId: record.id })),
    gstDetails: record.gstDetails.map((item) => ({ ...item, contactId: record.id })),
  })

  if (
    contacts.some(
      (contact) =>
        contact.id !== record.id &&
        contact.code.trim().toUpperCase() === record.code.trim().toUpperCase()
    )
  ) {
    throw new ApplicationError("Contact code already exists.", { code: record.code }, 409)
  }

  const nextContacts = [...contacts, record]
  await writeContacts(database, nextContacts)

  return contactResponseSchema.parse({
    item: record,
  })
}

export async function updateContact(
  database: Kysely<unknown>,
  _user: AuthUser,
  contactId: string,
  payload: unknown
): Promise<ContactResponse> {
  const parsedPayload = contactUpsertPayloadSchema.parse(payload)
  const contacts = await readContacts(database)
  const existing = contacts.find((item) => item.id === contactId)

  if (!existing) {
    throw new ApplicationError("Contact could not be found.", { contactId }, 404)
  }

  findDuplicateContact(contacts, parsedPayload, contactId)

  const updated = buildContactRecord(contacts, parsedPayload, existing)
  if (
    contacts.some(
      (contact) =>
        contact.id !== contactId &&
        contact.code.trim().toUpperCase() === updated.code.trim().toUpperCase()
    )
  ) {
    throw new ApplicationError("Contact code already exists.", { code: updated.code }, 409)
  }
  const nextContacts = contacts.map((item) => (item.id === contactId ? updated : item))
  await writeContacts(database, nextContacts)

  return contactResponseSchema.parse({
    item: updated,
  })
}

export async function deleteContact(
  database: Kysely<unknown>,
  _user: AuthUser,
  contactId: string
) {
  const contacts = await readContacts(database)
  const nextContacts = contacts.filter((item) => item.id !== contactId)

  if (nextContacts.length === contacts.length) {
    throw new ApplicationError("Contact could not be found.", { contactId }, 404)
  }

  await writeContacts(database, nextContacts)

  return {
    deleted: true as const,
    id: contactId,
  }
}
