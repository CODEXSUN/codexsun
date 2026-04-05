import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import {
  createContact,
  getContact,
  listContacts,
  updateContact,
} from "../../../core/src/services/contact-service.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { AuthUser } from "../../../cxapp/shared/schemas/auth.js"
import { createAuthService } from "../../../cxapp/src/services/service-factory.js"
import {
  customerAccountSchema,
  customerProfileSchema,
  customerProfileUpdatePayloadSchema,
  customerRegisterPayloadSchema,
  type CustomerAccount,
  type CustomerProfile,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"

const systemActor: AuthUser = {
  id: "auth-user:ecommerce-system",
  email: "storefront@codexsun.local",
  phoneNumber: "0000000000",
  displayName: "Ecommerce System",
  actorType: "admin",
  isSuperAdmin: false,
  avatarUrl: null,
  isActive: true,
  organizationName: "Codexsun",
  roles: [],
  permissions: [],
  createdAt: "2026-04-04T10:00:00.000Z",
  updatedAt: "2026-04-04T10:00:00.000Z",
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

async function readCustomerAccounts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<CustomerAccount>(
    database,
    ecommerceTableNames.customerAccounts
  )

  return items.map((item) => customerAccountSchema.parse(item))
}

async function writeCustomerAccounts(database: Kysely<unknown>, items: CustomerAccount[]) {
  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.customerAccounts,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "customer-account",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function buildCustomerProfile(
  database: Kysely<unknown>,
  account: CustomerAccount
): Promise<CustomerProfile> {
  const contact = await getContact(database, systemActor, account.coreContactId)

  return customerProfileSchema.parse({
    id: account.id,
    authUserId: account.authUserId,
    coreContactId: account.coreContactId,
    email: account.email,
    phoneNumber: account.phoneNumber,
    displayName: account.displayName,
    companyName: account.companyName,
    gstin: account.gstin,
    addresses: contact.item.addresses,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  })
}

async function findAccountByEmail(database: Kysely<unknown>, email: string) {
  const accounts = await readCustomerAccounts(database)
  return accounts.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null
}

async function resolveExistingContactId(
  database: Kysely<unknown>,
  email: string,
  phoneNumber: string | null
) {
  const normalizedPhoneNumber = phoneNumber?.trim() ?? ""
  const contacts = await listContacts(database)
  const match = contacts.items.find(
    (item) =>
      item.primaryEmail?.toLowerCase() === email.toLowerCase() ||
      (normalizedPhoneNumber.length > 0 &&
        item.primaryPhone?.trim() === normalizedPhoneNumber)
  )

  return match?.id ?? null
}

function resolveContactTypeId(gstin: string | null) {
  return gstin
    ? "contact-type:registered-customer-b2b"
    : "contact-type:unregistered-customer-b2c"
}

function isCustomerPortalUser(user: AuthUser) {
  return (
    user.actorType === "customer" ||
    user.roles.some((role) => role.key === "customer_portal")
  )
}

function ensureCustomerPortalUser(user: AuthUser) {
  if (!isCustomerPortalUser(user)) {
    throw new ApplicationError(
      "This account does not have customer portal access.",
      { actorType: user.actorType, email: user.email },
      403
    )
  }

  return user
}

async function getAuthenticatedCustomerUser(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const authService = createAuthService(database, config)
  return ensureCustomerPortalUser(await authService.getAuthenticatedUser(token))
}

async function ensureCustomerAccountForUser(
  database: Kysely<unknown>,
  user: AuthUser
) {
  const accounts = await readCustomerAccounts(database)
  const now = new Date().toISOString()
  const matchingAccount =
    accounts.find((item) => item.authUserId === user.id) ??
    accounts.find((item) => item.email.toLowerCase() === user.email.toLowerCase()) ??
    null

  if (matchingAccount) {
    const updatedAccount = customerAccountSchema.parse({
      ...matchingAccount,
      authUserId: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber ?? matchingAccount.phoneNumber,
      displayName: user.displayName,
      companyName:
        matchingAccount.companyName ?? normalizeOptionalString(user.organizationName),
      isActive: user.isActive,
      lastLoginAt: now,
      updatedAt: now,
    })

    await writeCustomerAccounts(
      database,
      accounts.map((item) => (item.id === updatedAccount.id ? updatedAccount : item))
    )

    return updatedAccount
  }

  const phoneNumber = user.phoneNumber?.trim() || "0000000000"
  const existingContactId = await resolveExistingContactId(database, user.email, phoneNumber)
  const coreContactId =
    existingContactId ??
    (
      await createContact(database, systemActor, {
        code: "",
        contactTypeId: resolveContactTypeId(null),
        ledgerId: null,
        ledgerName: null,
        name: user.displayName,
        legalName: user.organizationName ?? "",
        pan: "",
        gstin: "",
        msmeType: "",
        msmeNo: "",
        openingBalance: 0,
        balanceType: "",
        creditLimit: 0,
        website: "",
        description: "Storefront customer account.",
        isActive: true,
        addresses: [
          {
            addressTypeId: "address-type:shipping",
            addressLine1: "",
            addressLine2: "",
            cityId: null,
            districtId: null,
            stateId: null,
            countryId: null,
            pincodeId: null,
            latitude: null,
            longitude: null,
            isDefault: true,
          },
        ],
        emails: [{ email: user.email, emailType: "primary", isPrimary: true }],
        phones: [{ phoneNumber, phoneType: "mobile", isPrimary: true }],
        bankAccounts: [],
        gstDetails: [],
      })
    ).item.id

  const account = customerAccountSchema.parse({
    id: `ecommerce-customer:${randomUUID()}`,
    authUserId: user.id,
    coreContactId,
    email: user.email,
    phoneNumber,
    displayName: user.displayName,
    companyName: normalizeOptionalString(user.organizationName),
    gstin: null,
    isActive: user.isActive,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  })

  await writeCustomerAccounts(database, [account, ...accounts])
  return account
}

export async function registerCustomer(
  database: Kysely<unknown>,
  config: ServerConfig,
  payload: unknown
) {
  const parsed = customerRegisterPayloadSchema.parse(payload)

  if (await findAccountByEmail(database, parsed.email)) {
    throw new ApplicationError("An ecommerce account already exists for this email.", {}, 409)
  }

  const authService = createAuthService(database, config)
  const authUser = await authService.createPortalUser({
    email: parsed.email,
    phoneNumber: parsed.phoneNumber,
    password: parsed.password,
    displayName: parsed.displayName,
    actorType: "customer",
    organizationName: parsed.companyName ?? null,
  })

  const timestamp = new Date().toISOString()
  const gstin = normalizeOptionalString(parsed.gstin)
  const existingContactId = await resolveExistingContactId(
    database,
    parsed.email,
    parsed.phoneNumber
  )
  const coreContactId =
    existingContactId ??
    (
      await createContact(database, systemActor, {
        code: "",
        contactTypeId: resolveContactTypeId(gstin),
        ledgerId: null,
        ledgerName: null,
        name: parsed.displayName,
        legalName: parsed.companyName ?? "",
        pan: "",
        gstin: gstin ?? "",
        msmeType: "",
        msmeNo: "",
        openingBalance: 0,
        balanceType: "",
        creditLimit: 0,
        website: "",
        description: "Storefront customer account.",
        isActive: true,
        addresses: [
          {
            addressTypeId: "address-type:shipping",
            addressLine1: parsed.addressLine1,
            addressLine2: parsed.addressLine2 ?? "",
            cityId: null,
            districtId: null,
            stateId: null,
            countryId: null,
            pincodeId: null,
            latitude: null,
            longitude: null,
            isDefault: true,
          },
        ],
        emails: [{ email: parsed.email, emailType: "primary", isPrimary: true }],
        phones: [{ phoneNumber: parsed.phoneNumber, phoneType: "mobile", isPrimary: true }],
        bankAccounts: [],
        gstDetails: gstin ? [{ gstin, state: parsed.state, isDefault: true }] : [],
      })
    ).item.id

  const accounts = await readCustomerAccounts(database)
  const account = customerAccountSchema.parse({
    id: `ecommerce-customer:${randomUUID()}`,
    authUserId: authUser.id,
    coreContactId,
    email: parsed.email,
    phoneNumber: parsed.phoneNumber,
    displayName: parsed.displayName,
    companyName: normalizeOptionalString(parsed.companyName),
    gstin,
    isActive: true,
    lastLoginAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await writeCustomerAccounts(database, [account, ...accounts])

  return buildCustomerProfile(database, account)
}

export async function getAuthenticatedCustomer(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const account = await resolveAuthenticatedCustomerAccount(database, config, token)
  return buildCustomerProfile(database, account)
}

export async function resolveAuthenticatedCustomerAccount(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const user = await getAuthenticatedCustomerUser(database, config, token)
  return ensureCustomerAccountForUser(database, user)
}

export async function updateCustomerProfile(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  payload: unknown
) {
  const parsed = customerProfileUpdatePayloadSchema.parse(payload)
  const account = await resolveAuthenticatedCustomerAccount(database, config, token)
  const gstin = normalizeOptionalString(parsed.gstin)
  const accounts = await readCustomerAccounts(database)
  const contact = await getContact(database, systemActor, account.coreContactId)

  await updateContact(database, systemActor, contact.item.id, {
    code: contact.item.code,
    contactTypeId: resolveContactTypeId(gstin),
    ledgerId: contact.item.ledgerId,
    ledgerName: contact.item.ledgerName,
    name: parsed.displayName,
    legalName: parsed.companyName ?? "",
    pan: contact.item.pan ?? "",
    gstin: gstin ?? "",
    msmeType: contact.item.msmeType ?? "",
    msmeNo: contact.item.msmeNo ?? "",
    openingBalance: contact.item.openingBalance,
    balanceType: contact.item.balanceType ?? "",
    creditLimit: contact.item.creditLimit,
    website: contact.item.website ?? "",
    description: contact.item.description ?? "",
    isActive: true,
    addresses: [
      {
        addressTypeId:
          contact.item.addresses[0]?.addressTypeId ?? "address-type:shipping",
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2 ?? "",
        cityId: null,
        districtId: null,
        stateId: null,
        countryId: null,
        pincodeId: null,
        latitude: null,
        longitude: null,
        isDefault: true,
      },
    ],
    emails: [{ email: account.email, emailType: "primary", isPrimary: true }],
    phones: [{ phoneNumber: parsed.phoneNumber, phoneType: "mobile", isPrimary: true }],
    bankAccounts: contact.item.bankAccounts.map((item) => ({
      bankName: item.bankName,
      accountNumber: item.accountNumber,
      accountHolderName: item.accountHolderName,
      ifsc: item.ifsc,
      branch: item.branch ?? "",
      isPrimary: item.isPrimary,
    })),
    gstDetails: gstin ? [{ gstin, state: parsed.state, isDefault: true }] : [],
  })

  const updatedAccount = customerAccountSchema.parse({
    ...account,
    displayName: parsed.displayName,
    phoneNumber: parsed.phoneNumber,
    companyName: normalizeOptionalString(parsed.companyName),
    gstin,
    updatedAt: new Date().toISOString(),
  })

  await writeCustomerAccounts(
    database,
    accounts.map((item) => (item.id === updatedAccount.id ? updatedAccount : item))
  )

  return buildCustomerProfile(database, updatedAccount)
}
