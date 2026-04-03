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
  "contact-type:supplier": {
    ledgerId: "ledger-sundry-creditors",
    ledgerName: "Sundry Creditors",
  },
} as const

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

  return contactSchema.parse({
    ...contact,
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

function buildContactRecord(
  payload: ReturnType<typeof contactUpsertPayloadSchema.parse>,
  existing?: Contact
) {
  const timestamp = new Date().toISOString()
  const { primaryEmail, primaryPhone } = buildPrimaryFields(payload)

  return contactSchema.parse({
    id: existing?.id ?? `contact:${randomUUID()}`,
    uuid: existing?.uuid ?? randomUUID(),
    contactTypeId: payload.contactTypeId === "1" ? null : payload.contactTypeId,
    ledgerId: payload.ledgerId,
    ledgerName: payload.ledgerName,
    name: payload.name,
    legalName: payload.legalName === "-" ? null : payload.legalName,
    pan: payload.pan === "-" ? null : payload.pan,
    gstin: payload.gstin === "-" ? null : payload.gstin,
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
    addresses: payload.addresses.map((item, index) => ({
      id: existing?.addresses[index]?.id ?? `contact-address:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
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
      id: existing?.emails[index]?.id ?? `contact-email:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      email: item.email,
      emailType: item.emailType,
      isPrimary: item.isPrimary,
      isActive: payload.isActive,
      createdAt: existing?.emails[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    phones: payload.phones.map((item, index) => ({
      id: existing?.phones[index]?.id ?? `contact-phone:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      phoneNumber: item.phoneNumber,
      phoneType: item.phoneType,
      isPrimary: item.isPrimary,
      isActive: payload.isActive,
      createdAt: existing?.phones[index]?.createdAt ?? timestamp,
      updatedAt: timestamp,
    })),
    bankAccounts: payload.bankAccounts.map((item, index) => ({
      id: existing?.bankAccounts[index]?.id ?? `contact-bank:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
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
    gstDetails: payload.gstDetails.map((item, index) => ({
      id: existing?.gstDetails[index]?.id ?? `contact-gst:${randomUUID()}`,
      contactId: existing?.id ?? "pending",
      gstin: item.gstin,
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

  if (
    contacts.some(
      (contact) => contact.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Contact name already exists.", { name: parsedPayload.name }, 409)
  }

  let record = buildContactRecord(parsedPayload)
  record = contactSchema.parse({
    ...record,
    addresses: record.addresses.map((item) => ({ ...item, contactId: record.id })),
    emails: record.emails.map((item) => ({ ...item, contactId: record.id })),
    phones: record.phones.map((item) => ({ ...item, contactId: record.id })),
    bankAccounts: record.bankAccounts.map((item) => ({ ...item, contactId: record.id })),
    gstDetails: record.gstDetails.map((item) => ({ ...item, contactId: record.id })),
  })

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

  if (
    contacts.some(
      (contact) =>
        contact.id !== contactId &&
        contact.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
    )
  ) {
    throw new ApplicationError("Contact name already exists.", { name: parsedPayload.name }, 409)
  }

  const updated = buildContactRecord(parsedPayload, existing)
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
