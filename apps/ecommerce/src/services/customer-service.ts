import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { type StorefrontOrder } from "../../shared/index.js"
import { AuthRepository } from "../../../cxapp/src/repositories/auth-repository.js"
import {
  createContact,
  getContact,
  listContacts,
  updateContact,
} from "../../../core/src/services/contact-service.js"
import { listCommonModuleItems } from "../../../core/src/services/common-module-service.js"
import type { CommonModuleKey } from "../../../core/shared/index.js"
import {
  listJsonStorePayloads,
  replaceJsonStoreRecords,
} from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { AuthUser } from "../../../cxapp/shared/schemas/auth.js"
import {
  createAuthService,
  createMailboxService,
} from "../../../cxapp/src/services/service-factory.js"
import {
  customerPortalPreferencesUpdatePayloadSchema,
  customerPortalRecordSchema,
  customerPortalResponseSchema,
  customerLifecycleStateSchema,
  customerAccountSchema,
  customerProfileLookupResponseSchema,
  customerProfileSchema,
  customerProfileUpdatePayloadSchema,
  customerRegisterPayloadSchema,
  storefrontCustomerAdminReportSchema,
  storefrontCustomerAdminResponseSchema,
  storefrontCustomerLifecycleActionPayloadSchema,
  customerWishlistTogglePayloadSchema,
  type CustomerAccount,
  type CustomerLifecycleState,
  type CustomerPortalRecord,
  type CustomerPortalResponse,
  type CustomerProfile,
  type StorefrontCustomerAdminView,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"
import { readCoreProducts, toStorefrontProductCard } from "./catalog-service.js"
import { getStorefrontSettings } from "./storefront-settings-service.js"
import {
  sendStorefrontCampaignSubscriptionEmail,
  sendStorefrontWelcomeEmail,
} from "./storefront-mail-service.js"
import {
  storefrontSupportCaseSchema,
  storefrontOrderRequestSchema,
  type StorefrontOrderRequest,
  type StorefrontSupportCase,
} from "../../shared/index.js"

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

function resolveCustomerLifecycleState(
  value: unknown,
  fallbackIsActive: boolean
): CustomerLifecycleState {
  const parsed = customerLifecycleStateSchema.safeParse(value)

  if (parsed.success) {
    return parsed.data
  }

  return fallbackIsActive ? "active" : "blocked"
}

function isCustomerLifecycleActive(state: CustomerLifecycleState) {
  return state === "active"
}

function createAnonymizedCustomerEmail(accountId: string) {
  return `anonymized+${accountId.replace(/[^a-z0-9]/gi, "").toLowerCase()}@redacted.local`
}

function createAnonymizedCustomerPhone(accountId: string) {
  const digits = accountId.replace(/\D/g, "").slice(-10).padStart(10, "0")
  return digits
}

async function readSupportCases(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<StorefrontSupportCase>(
    database,
    ecommerceTableNames.supportCases
  )

  return items.map((item) => storefrontSupportCaseSchema.parse(item))
}

async function readOrderRequests(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<StorefrontOrderRequest>(
    database,
    ecommerceTableNames.orderRequests
  )

  return items.map((item) => storefrontOrderRequestSchema.parse(item))
}

export async function readCustomerAccounts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<CustomerAccount>(
    database,
    ecommerceTableNames.customerAccounts
  )

  return items.map((item) =>
    customerAccountSchema.parse({
      ...item,
      lifecycleState: resolveCustomerLifecycleState(item.lifecycleState, Boolean(item.isActive)),
      lifecycleNote: item.lifecycleNote ?? null,
      blockedAt: item.blockedAt ?? null,
      deletedAt: item.deletedAt ?? null,
      anonymizedAt: item.anonymizedAt ?? null,
    })
  )
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

async function readCustomerPortalRecords(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<CustomerPortalRecord>(
    database,
    ecommerceTableNames.customerPortal
  )

  return items.map((item) => customerPortalRecordSchema.parse(item))
}

async function writeCustomerPortalRecords(database: Kysely<unknown>, items: CustomerPortalRecord[]) {
  await replaceJsonStoreRecords(
    database,
    ecommerceTableNames.customerPortal,
    items.map((item, index) => ({
      id: item.id,
      moduleKey: "customer-portal",
      sortOrder: index + 1,
      payload: item,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  )
}

async function readOrders(database: Kysely<unknown>) {
  return readStorefrontOrders(database)
}

function orderBelongsToAccount(order: StorefrontOrder, account: CustomerAccount) {
  if (order.customerAccountId === account.id) {
    return true
  }

  const accountEmail = account.email.trim().toLowerCase()
  const shippingEmail = order.shippingAddress.email.trim().toLowerCase()

  return (
    order.coreContactId === account.coreContactId ||
    shippingEmail === accountEmail
  )
}

function inferRewardsTier(pointsBalance: number) {
  if (pointsBalance >= 1200) {
    return "platinum" as const
  }

  if (pointsBalance >= 700) {
    return "gold" as const
  }

  if (pointsBalance >= 300) {
    return "silver" as const
  }

  return "bronze" as const
}

function nextTierTarget(tier: "bronze" | "silver" | "gold" | "platinum") {
  switch (tier) {
    case "bronze":
      return { nextTier: "silver" as const, threshold: 300 }
    case "silver":
      return { nextTier: "gold" as const, threshold: 700 }
    case "gold":
      return { nextTier: "platinum" as const, threshold: 1200 }
    default:
      return { nextTier: null, threshold: 1200 }
  }
}

function createDefaultPortalRecord(account: CustomerAccount): CustomerPortalRecord {
  const now = new Date().toISOString()
  const codeBase = account.displayName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 6) || "CUSTOM"
  const welcomeCouponCode = `${codeBase}10`
  const giftCardCode = `GC-${codeBase}-${account.id.slice(-4).toUpperCase()}`
  const pointsBalance = 120
  const tier = inferRewardsTier(pointsBalance)
  const nextTier = nextTierTarget(tier)

  return customerPortalRecordSchema.parse({
    id: `customer-portal:${account.id}`,
    customerAccountId: account.id,
    wishlistProductIds: [],
    coupons: [
      {
        id: `coupon:${account.id}:welcome`,
        code: welcomeCouponCode,
        title: "Welcome savings",
        summary: "Use this on your next checkout for a first-order discount.",
        discountLabel: "10% off",
        minimumOrderAmount: 1499,
        expiresAt: null,
        status: "active",
      },
      {
        id: `coupon:${account.id}:shipping`,
        code: `SHIPFREE-${codeBase}`,
        title: "Free shipping",
        summary: "Unlock complimentary shipping on qualifying carts.",
        discountLabel: "Free shipping",
        minimumOrderAmount: 1999,
        expiresAt: null,
        status: "active",
      },
    ],
    giftCards: [
      {
        id: `gift-card:${account.id}:welcome`,
        code: giftCardCode,
        title: "Welcome gift card",
        summary: "Wallet-style store credit available across future orders.",
        balanceAmount: 500,
        expiresAt: null,
        status: "active",
      },
    ],
    rewards: {
      tier,
      pointsBalance,
      lifetimePoints: pointsBalance,
      nextTier: nextTier.nextTier,
      pointsToNextTier: Math.max(0, nextTier.threshold - pointsBalance),
      activities: [
        {
          id: `reward:${account.id}:signup`,
          type: "signup",
          label: "Account created",
          summary: "Welcome reward credited for joining the customer portal.",
          points: 120,
          createdAt: now,
        },
      ],
    },
    preferences: {
      orderUpdates: true,
      wishlistAlerts: true,
      priceDropAlerts: true,
      marketingEmails: true,
      smsAlerts: false,
    },
    createdAt: now,
    updatedAt: now,
  })
}

function upsertPortalRecord(
  records: CustomerPortalRecord[],
  updatedRecord: CustomerPortalRecord
) {
  const hasExisting = records.some((item) => item.customerAccountId === updatedRecord.customerAccountId)

  if (!hasExisting) {
    return [updatedRecord, ...records]
  }

  return records.map((item) =>
    item.customerAccountId === updatedRecord.customerAccountId ? updatedRecord : item
  )
}

export async function listWelcomeMailProducts(database: Kysely<unknown>) {
  const products = (await readCoreProducts(database))
    .filter((item) => item.isActive)
    .map((item) => toStorefrontProductCard(item))

  const newArrivals = products.filter((item) => item.isNewArrival)
  return (newArrivals.length > 0 ? newArrivals : products).slice(0, 4)
}

async function ensureCustomerPortalRecord(
  database: Kysely<unknown>,
  account: CustomerAccount
) {
  const records = await readCustomerPortalRecords(database)
  const existing = records.find((item) => item.customerAccountId === account.id) ?? null

  if (existing) {
    return existing
  }

  const record = createDefaultPortalRecord(account)
  await writeCustomerPortalRecords(database, [record, ...records])
  return record
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
    contactTypeId: contact.item.contactTypeId,
    email: account.email,
    primaryEmail: contact.item.primaryEmail ?? account.email,
    phoneNumber: account.phoneNumber,
    primaryPhone: contact.item.primaryPhone ?? account.phoneNumber,
    displayName: account.displayName,
    companyName: account.companyName,
    legalName: contact.item.legalName,
    gstin: account.gstin,
    website: contact.item.website,
    isActive: contact.item.isActive,
    lifecycleState: account.lifecycleState,
    lifecycleNote: account.lifecycleNote,
    blockedAt: account.blockedAt,
    deletedAt: account.deletedAt,
    anonymizedAt: account.anonymizedAt,
    addresses: contact.item.addresses,
    emails: contact.item.emails,
    phones: contact.item.phones,
    bankAccounts: contact.item.bankAccounts,
    gstDetails: contact.item.gstDetails,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  })
}

export async function getAuthenticatedCustomerProfileLookups(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  await resolveAuthenticatedCustomerAccount(database, config, token)

  const moduleKeys = [
    "addressTypes",
    "bankNames",
    "countries",
    "states",
    "districts",
    "cities",
    "pincodes",
  ] as const satisfies CommonModuleKey[]

  const entries = await Promise.all(
    moduleKeys.map(async (moduleKey) => [
      moduleKey,
      (await listCommonModuleItems(database, moduleKey)).items,
    ] as const)
  )

  return customerProfileLookupResponseSchema.parse(Object.fromEntries(entries))
}

export async function getStorefrontCustomerProfileLookups(database: Kysely<unknown>) {
  const moduleKeys = [
    "addressTypes",
    "bankNames",
    "countries",
    "states",
    "districts",
    "cities",
    "pincodes",
  ] as const satisfies CommonModuleKey[]

  const entries = await Promise.all(
    moduleKeys.map(async (moduleKey) => [
      moduleKey,
      (await listCommonModuleItems(database, moduleKey)).items,
    ] as const)
  )

  return customerProfileLookupResponseSchema.parse(Object.fromEntries(entries))
}

async function buildCustomerPortalResponse(
  database: Kysely<unknown>,
  account: CustomerAccount
): Promise<CustomerPortalResponse> {
  const [profile, portalRecord, coreProducts, orders] = await Promise.all([
    buildCustomerProfile(database, account),
    ensureCustomerPortalRecord(database, account),
    readCoreProducts(database),
    readOrders(database),
  ])

  const wishlist = portalRecord.wishlistProductIds
    .map((productId) => coreProducts.find((item) => item.id === productId) ?? null)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.isActive)
    .map(toStorefrontProductCard)

  const customerOrders = orders.filter((item) => orderBelongsToAccount(item, account))

  return customerPortalResponseSchema.parse({
    profile,
    wishlist,
    coupons: portalRecord.coupons,
    giftCards: portalRecord.giftCards,
    rewards: portalRecord.rewards,
    preferences: portalRecord.preferences,
    stats: {
      orderCount: customerOrders.length,
      wishlistCount: wishlist.length,
      activeCouponCount: portalRecord.coupons.filter((item) => item.status === "active").length,
      activeGiftCardCount: portalRecord.giftCards.filter((item) => item.status === "active").length,
    },
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
      lifecycleState: user.isActive
        ? matchingAccount.lifecycleState === "active"
          ? "active"
          : matchingAccount.lifecycleState
        : matchingAccount.lifecycleState === "active"
          ? "blocked"
          : matchingAccount.lifecycleState,
      lifecycleNote: matchingAccount.lifecycleNote ?? null,
      blockedAt: matchingAccount.blockedAt ?? null,
      deletedAt: matchingAccount.deletedAt ?? null,
      anonymizedAt: matchingAccount.anonymizedAt ?? null,
      lastLoginAt: now,
      updatedAt: now,
    })

    await writeCustomerAccounts(
      database,
      accounts.map((item) => (item.id === updatedAccount.id ? updatedAccount : item))
    )
    await ensureCustomerPortalRecord(database, updatedAccount)

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
    lifecycleState: user.isActive ? "active" : "blocked",
    lifecycleNote: null,
    blockedAt: user.isActive ? null : now,
    deletedAt: null,
    anonymizedAt: null,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  })

  await writeCustomerAccounts(database, [account, ...accounts])
  await ensureCustomerPortalRecord(database, account)
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
            cityId: parsed.city,
            districtId: null,
            stateId: parsed.state,
            countryId: parsed.country,
            pincodeId: parsed.pincode,
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
    lifecycleState: "active",
    lifecycleNote: null,
    blockedAt: null,
    deletedAt: null,
    anonymizedAt: null,
    lastLoginAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await writeCustomerAccounts(database, [account, ...accounts])
  await ensureCustomerPortalRecord(database, account)

  try {
    const [settings, newArrivalItems] = await Promise.all([
      getStorefrontSettings(database),
      listWelcomeMailProducts(database),
    ])

    await sendStorefrontWelcomeEmail({
      mailboxService: createMailboxService(database, config),
      config,
      settings,
      account,
      newArrivalItems,
    })
  } catch (error) {
    console.error("Unable to send storefront welcome email.", error)
  }

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

export async function getAuthenticatedCustomerPortal(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const account = await resolveAuthenticatedCustomerAccount(database, config, token)
  return buildCustomerPortalResponse(database, account)
}

export async function resolveAuthenticatedCustomerAccount(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const user = await getAuthenticatedCustomerUser(database, config, token)
  const account = await ensureCustomerAccountForUser(database, user)

  if (!isCustomerLifecycleActive(account.lifecycleState)) {
    throw new ApplicationError(
      account.lifecycleState === "blocked"
        ? "This customer account is blocked."
        : account.lifecycleState === "deleted"
          ? "This customer account has been deleted."
          : "This customer account has been anonymized.",
      { customerAccountId: account.id, lifecycleState: account.lifecycleState },
      403
    )
  }

  return account
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
  const website = normalizeOptionalString(parsed.website)
  const legalName = normalizeOptionalString(parsed.legalName)
  const accounts = await readCustomerAccounts(database)
  const contact = await getContact(database, systemActor, account.coreContactId)
  const primaryPhone =
    parsed.phones.find((item) => item.isPrimary && normalizeOptionalString(item.phoneNumber)) ??
    parsed.phones.find((item) => normalizeOptionalString(item.phoneNumber)) ??
    null
  const nextEmails = parsed.emails.filter((item) => normalizeOptionalString(item.email))
  const nextPhones = parsed.phones.filter((item) => normalizeOptionalString(item.phoneNumber))
  const nextAddresses = parsed.addresses.filter((item) => normalizeOptionalString(item.addressLine1))
  const nextBankAccounts = parsed.bankAccounts.filter(
    (item) =>
      normalizeOptionalString(item.bankName) ||
      normalizeOptionalString(item.accountNumber) ||
      normalizeOptionalString(item.accountHolderName) ||
      normalizeOptionalString(item.ifsc) ||
      normalizeOptionalString(item.branch)
  )
  const nextGstDetails = parsed.gstDetails.filter(
    (item) => normalizeOptionalString(item.gstin) || normalizeOptionalString(item.state)
  )
  const derivedGstin =
    normalizeOptionalString(
      nextGstDetails.find((item) => item.isDefault)?.gstin ?? nextGstDetails[0]?.gstin ?? null
    ) ?? gstin

  await updateContact(database, systemActor, contact.item.id, {
    code: contact.item.code,
    contactTypeId: resolveContactTypeId(derivedGstin),
    ledgerId: contact.item.ledgerId,
    ledgerName: contact.item.ledgerName,
    name: parsed.displayName,
    legalName: legalName ?? parsed.companyName ?? "",
    pan: contact.item.pan ?? "",
    gstin: derivedGstin ?? "",
    msmeType: contact.item.msmeType ?? "",
    msmeNo: contact.item.msmeNo ?? "",
    openingBalance: contact.item.openingBalance,
    balanceType: contact.item.balanceType ?? "",
    creditLimit: contact.item.creditLimit,
    website: website ?? "",
    description: contact.item.description ?? "",
    isActive: true,
    addresses: nextAddresses,
    emails: nextEmails,
    phones: nextPhones,
    bankAccounts: nextBankAccounts,
    gstDetails: nextGstDetails,
  })

  const updatedAccount = customerAccountSchema.parse({
    ...account,
    displayName: parsed.displayName,
    phoneNumber: primaryPhone?.phoneNumber?.trim() || account.phoneNumber,
    companyName: normalizeOptionalString(parsed.companyName),
    gstin: derivedGstin,
    updatedAt: new Date().toISOString(),
  })

  await writeCustomerAccounts(
    database,
    accounts.map((item) => (item.id === updatedAccount.id ? updatedAccount : item))
  )

  return buildCustomerProfile(database, updatedAccount)
}

export async function updateCustomerPortalPreferences(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  payload: unknown
) {
  const parsed = customerPortalPreferencesUpdatePayloadSchema.parse(payload ?? {})
  const account = await resolveAuthenticatedCustomerAccount(database, config, token)
  const records = await readCustomerPortalRecords(database)
  const record = await ensureCustomerPortalRecord(database, account)
  const shouldSendSubscriptionMail =
    record.preferences.marketingEmails === false && parsed.marketingEmails === true
  const updatedRecord = customerPortalRecordSchema.parse({
    ...record,
    preferences: {
      ...record.preferences,
      ...parsed,
    },
    updatedAt: new Date().toISOString(),
  })

  await writeCustomerPortalRecords(
    database,
    upsertPortalRecord(records, updatedRecord)
  )

  if (shouldSendSubscriptionMail) {
    try {
      await sendStorefrontCampaignSubscriptionEmail({
        mailboxService: createMailboxService(database, config),
        config,
        settings: await getStorefrontSettings(database),
        account,
      })
    } catch (error) {
      console.error("Unable to send storefront campaign subscription email.", error)
    }
  }

  return buildCustomerPortalResponse(database, account)
}

export async function toggleCustomerWishlistItem(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string,
  payload: unknown
) {
  const parsed = customerWishlistTogglePayloadSchema.parse(payload)
  const account = await resolveAuthenticatedCustomerAccount(database, config, token)
  const records = await readCustomerPortalRecords(database)
  const record = await ensureCustomerPortalRecord(database, account)
  const nextWishlistProductIds = record.wishlistProductIds.includes(parsed.productId)
    ? record.wishlistProductIds.filter((item) => item !== parsed.productId)
    : [parsed.productId, ...record.wishlistProductIds]
  const updatedRecord = customerPortalRecordSchema.parse({
    ...record,
    wishlistProductIds: nextWishlistProductIds,
    updatedAt: new Date().toISOString(),
  })

  await writeCustomerPortalRecords(
    database,
    upsertPortalRecord(records, updatedRecord)
  )

  return buildCustomerPortalResponse(database, account)
}

async function syncCustomerAuthState(
  database: Kysely<unknown>,
  account: CustomerAccount
) {
  if (!account.authUserId) {
    return
  }

  const repository = new AuthRepository(database)
  const storedUser = await repository.findById(account.authUserId)

  if (!storedUser) {
    return
  }

  const shouldBeActive = isCustomerLifecycleActive(account.lifecycleState)

  if (storedUser.user.isActive !== shouldBeActive) {
    await repository.setUserActiveState(account.authUserId, shouldBeActive)
  }

  if (!shouldBeActive) {
    await repository.revokeSessionsForUser(account.authUserId)
  }
}

async function anonymizeCustomerIdentity(
  database: Kysely<unknown>,
  account: CustomerAccount
) {
  const anonymizedEmail = createAnonymizedCustomerEmail(account.id)
  const anonymizedPhone = createAnonymizedCustomerPhone(account.id)
  const anonymizedDisplayName = `Anonymized Customer ${account.id.slice(-4).toUpperCase()}`
  const repository = new AuthRepository(database)

  if (account.authUserId) {
    const storedUser = await repository.findById(account.authUserId)

    if (storedUser) {
      await repository.updateUser({
        id: storedUser.user.id,
        email: anonymizedEmail,
        phoneNumber: anonymizedPhone,
        displayName: anonymizedDisplayName,
        actorType: storedUser.user.actorType,
        avatarUrl: storedUser.user.avatarUrl,
        organizationName: null,
        isSuperAdmin: storedUser.user.isSuperAdmin,
        isActive: false,
      })
      await repository.revokeSessionsForUser(storedUser.user.id)
    }
  }

  const contact = await getContact(database, systemActor, account.coreContactId)

  await updateContact(database, systemActor, contact.item.id, {
    code: contact.item.code,
    contactTypeId: contact.item.contactTypeId,
    ledgerId: contact.item.ledgerId,
    ledgerName: contact.item.ledgerName,
    name: anonymizedDisplayName,
    legalName: "",
    pan: "",
    gstin: "",
    msmeType: "",
    msmeNo: "",
    openingBalance: contact.item.openingBalance,
    balanceType: contact.item.balanceType ?? "",
    creditLimit: contact.item.creditLimit,
    website: "",
    description: "Customer account anonymized for privacy handling.",
    isActive: false,
    addresses: [],
    emails: [],
    phones: [],
    bankAccounts: [],
    gstDetails: [],
  })

  return {
    email: anonymizedEmail,
    phoneNumber: anonymizedPhone,
    displayName: anonymizedDisplayName,
  }
}

function buildCustomerAdminView(input: {
  account: CustomerAccount
  orders: StorefrontOrder[]
  supportCases: StorefrontSupportCase[]
  orderRequests: StorefrontOrderRequest[]
}): StorefrontCustomerAdminView {
  const { account, orders, supportCases, orderRequests } = input
  const matchingOrders = orders.filter((item) => orderBelongsToAccount(item, account))
  const matchingSupportCases = supportCases.filter(
    (item) => item.customerAccountId === account.id
  )
  const matchingRequests = orderRequests.filter((item) => item.customerAccountId === account.id)
  const lastOrderAt =
    matchingOrders
      .map((item) => item.updatedAt)
      .sort((left, right) => right.localeCompare(left))[0] ?? null

  return {
    id: account.id,
    authUserId: account.authUserId,
    coreContactId: account.coreContactId,
    displayName: account.displayName,
    email: account.email,
    phoneNumber: account.phoneNumber,
    companyName: account.companyName,
    gstin: account.gstin,
    isActive: account.isActive,
    lifecycleState: account.lifecycleState,
    lifecycleNote: account.lifecycleNote,
    blockedAt: account.blockedAt,
    deletedAt: account.deletedAt,
    anonymizedAt: account.anonymizedAt,
    lastLoginAt: account.lastLoginAt,
    orderCount: matchingOrders.length,
    supportCaseCount: matchingSupportCases.length,
    requestCount: matchingRequests.length,
    lastOrderAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

export async function getStorefrontCustomerOperationsReport(database: Kysely<unknown>) {
  const [accounts, orders, supportCases, orderRequests] = await Promise.all([
    readCustomerAccounts(database),
    readOrders(database),
    readSupportCases(database),
    readOrderRequests(database),
  ])

  const items = accounts
    .map((account) =>
      buildCustomerAdminView({
        account,
        orders,
        supportCases,
        orderRequests,
      })
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return storefrontCustomerAdminReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalCustomers: items.length,
      activeCount: items.filter((item) => item.lifecycleState === "active").length,
      blockedCount: items.filter((item) => item.lifecycleState === "blocked").length,
      deletedCount: items.filter((item) => item.lifecycleState === "deleted").length,
      anonymizedCount: items.filter((item) => item.lifecycleState === "anonymized").length,
    },
    items,
  })
}

export async function getStorefrontCustomerAccount(
  database: Kysely<unknown>,
  customerAccountId: string
) {
  const report = await getStorefrontCustomerOperationsReport(database)
  const item = report.items.find((entry) => entry.id === customerAccountId) ?? null

  if (!item) {
    throw new ApplicationError("Customer account could not be found.", { customerAccountId }, 404)
  }

  return storefrontCustomerAdminResponseSchema.parse({ item })
}

export async function applyStorefrontCustomerLifecycleAction(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsed = storefrontCustomerLifecycleActionPayloadSchema.parse(payload)
  const accounts = await readCustomerAccounts(database)
  const existing = accounts.find((item) => item.id === parsed.customerAccountId) ?? null

  if (!existing) {
    throw new ApplicationError(
      "Customer account could not be found.",
      { customerAccountId: parsed.customerAccountId },
      404
    )
  }

  if (existing.lifecycleState === "anonymized" && parsed.action !== "anonymize") {
    throw new ApplicationError(
      "An anonymized customer account cannot be restored or edited further.",
      { customerAccountId: existing.id, lifecycleState: existing.lifecycleState },
      409
    )
  }

  const timestamp = new Date().toISOString()
  let nextAccount = existing

  if (parsed.action === "anonymize") {
    const anonymized = await anonymizeCustomerIdentity(database, existing)
    nextAccount = customerAccountSchema.parse({
      ...existing,
      authUserId: existing.authUserId,
      email: anonymized.email,
      phoneNumber: anonymized.phoneNumber,
      displayName: anonymized.displayName,
      companyName: null,
      gstin: null,
      isActive: false,
      lifecycleState: "anonymized",
      lifecycleNote: parsed.note,
      blockedAt: existing.blockedAt,
      deletedAt: existing.deletedAt,
      anonymizedAt: timestamp,
      updatedAt: timestamp,
    })
  } else {
    const lifecycleState: CustomerLifecycleState =
      parsed.action === "activate"
        ? "active"
        : parsed.action === "block"
          ? "blocked"
          : "deleted"

    nextAccount = customerAccountSchema.parse({
      ...existing,
      isActive: lifecycleState === "active",
      lifecycleState,
      lifecycleNote: parsed.note,
      blockedAt: lifecycleState === "blocked" ? timestamp : null,
      deletedAt: lifecycleState === "deleted" ? timestamp : null,
      anonymizedAt: existing.anonymizedAt,
      updatedAt: timestamp,
    })
  }

  await writeCustomerAccounts(
    database,
    accounts.map((item) => (item.id === nextAccount.id ? nextAccount : item))
  )
  await syncCustomerAuthState(database, nextAccount)

  return getStorefrontCustomerAccount(database, nextAccount.id)
}
