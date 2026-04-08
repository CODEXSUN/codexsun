import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"
import { listActivityLogs } from "../../../framework/src/runtime/activity-log/activity-log-service.js"
import {
  enqueueRuntimeJob,
  listActiveRuntimeJobsByHandler,
} from "../../../framework/src/runtime/jobs/runtime-job-service.js"
import { type StorefrontOrder } from "../../shared/index.js"
import { asQueryDatabase } from "../../../cxapp/src/data/query-database.js"
import { AuthRepository } from "../../../cxapp/src/repositories/auth-repository.js"
import { MailboxRepository } from "../../../cxapp/src/repositories/mailbox-repository.js"
import { cxappTableNames } from "../../../cxapp/database/table-names.js"
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
  customerCommercialProfileSchema,
  customerLifecycleMarketingStateSchema,
  customerLifecycleStateSchema,
  customerAccountSchema,
  customerProfileLookupResponseSchema,
  customerProfileSchema,
  customerProfileUpdatePayloadSchema,
  customerRegisterPayloadSchema,
  storefrontCustomerSuspiciousLoginEventSchema,
  storefrontCustomerAdminReportSchema,
  storefrontCustomerAdminResponseSchema,
  storefrontCustomerDeleteEligibilitySchema,
  storefrontCustomerLifecycleActionPayloadSchema,
  storefrontCustomerPermanentDeletePayloadSchema,
  storefrontCustomerPermanentDeleteResponseSchema,
  storefrontCustomerSecurityReviewPayloadSchema,
  storefrontCustomerSelfDeactivateResponseSchema,
  storefrontCustomerWelcomeMailSendResponseSchema,
  customerWishlistTogglePayloadSchema,
  type CustomerAccount,
  type CustomerCommercialProfile,
  type CustomerLifecycleState,
  type CustomerLifecycleMarketingState,
  type CustomerPortalCoupon,
  type CustomerPortalRecord,
  type CustomerPortalResponse,
  type CustomerProfile,
  type StorefrontCustomerSegmentReport,
  type StorefrontLifecycleMarketingReport,
  type StorefrontCustomerAdminView,
  type StorefrontCustomerSuspiciousLoginEvent,
  type StorefrontCustomerDeleteEligibility,
  storefrontCustomerSegmentReportSchema,
  storefrontLifecycleMarketingReportSchema,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"
import { readStorefrontOrders } from "./storefront-order-storage.js"
import { toStorefrontProductCard } from "./catalog-service.js"
import { readProjectedStorefrontProducts } from "./projected-product-service.js"
import { getEcommerceSettings } from "./ecommerce-settings-service.js"
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

function normalizeEmailVerificationTimestamp(value: string | null | undefined, fallback: string) {
  return normalizeOptionalString(value) ?? fallback
}

function createAnonymizedCustomerEmail(accountId: string) {
  return `anonymized+${accountId.replace(/[^a-z0-9]/gi, "").toLowerCase()}@redacted.local`
}

function createAnonymizedCustomerPhone(accountId: string) {
  const digits = accountId.replace(/\D/g, "").slice(-10).padStart(10, "0")
  return digits
}

const customerAccountBootstrapLocks = new Map<string, Promise<void>>()
const customerPortalRecordLocks = new Map<string, Promise<void>>()

type CustomerWelcomeMailStatusSnapshot = {
  status: "not_sent" | "queued" | "sent" | "failed"
  lastAttemptAt: string | null
  sentAt: string | null
  failedAt: string | null
  errorMessage: string | null
}

async function runExclusiveByKey<T>(
  locks: Map<string, Promise<void>>,
  key: string,
  operation: () => Promise<T>
) {
  const previous = locks.get(key) ?? Promise.resolve()
  let releaseCurrent!: () => void
  const current = new Promise<void>((resolve) => {
    releaseCurrent = resolve
  })
  const queued = previous.then(() => current)
  locks.set(key, queued)

  await previous

  try {
    return await operation()
  } finally {
    releaseCurrent()

    if (locks.get(key) === queued) {
      locks.delete(key)
    }
  }
}

function sortRecordsByCreatedAtAndId<T extends { createdAt: string; id: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const createdAtComparison = left.createdAt.localeCompare(right.createdAt)

    if (createdAtComparison !== 0) {
      return createdAtComparison
    }

    return left.id.localeCompare(right.id)
  })
}

function shouldRefreshCustomerActivityTimestamp(
  value: string | null,
  now: string,
  thresholdMs = 60_000
) {
  if (!value) {
    return true
  }

  const lastSeenAt = new Date(value).getTime()
  const currentTime = new Date(now).getTime()

  if (Number.isNaN(lastSeenAt) || Number.isNaN(currentTime)) {
    return true
  }

  return currentTime - lastSeenAt >= thresholdMs
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
      emailVerifiedAt: normalizeEmailVerificationTimestamp(item.emailVerifiedAt, item.createdAt),
      suspiciousLoginReviewedAt: item.suspiciousLoginReviewedAt ?? null,
      suspiciousLoginReviewNote: item.suspiciousLoginReviewNote ?? null,
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

  return items.map((item) => {
    const baseProfile = customerCommercialProfileSchema.parse({
      segmentKey:
        item.commercialProfile?.segmentKey === "repeat_customer" ||
        item.commercialProfile?.segmentKey === "vip" ||
        item.commercialProfile?.segmentKey === "at_risk" ||
        item.commercialProfile?.segmentKey === "dormant"
          ? item.commercialProfile.segmentKey
          : "new_customer",
      orderCount: Math.max(0, Number(item.commercialProfile?.orderCount ?? 0)),
      lifetimeSpend: roundCurrencyAmount(Number(item.commercialProfile?.lifetimeSpend ?? 0)),
      lastOrderAt: item.commercialProfile?.lastOrderAt ?? null,
      priceAdjustmentPercent: Number(item.commercialProfile?.priceAdjustmentPercent ?? 0),
      promotionLabel: item.commercialProfile?.promotionLabel ?? null,
      source:
        item.commercialProfile?.source === "frappe_enrichment"
          ? "frappe_enrichment"
          : "ecommerce_rules",
    })

    return customerPortalRecordSchema.parse({
      ...item,
      wishlistUpdatedAt: item.wishlistUpdatedAt ?? null,
      commercialProfile: baseProfile,
      lifecycleMarketing: customerLifecycleMarketingStateSchema.parse({
        stage: item.lifecycleMarketing?.stage ?? "welcome",
        emailSubscriptionStatus:
          item.lifecycleMarketing?.emailSubscriptionStatus === "suppressed"
            ? "suppressed"
            : item.lifecycleMarketing?.emailSubscriptionStatus === "unsubscribed"
              ? "unsubscribed"
              : "subscribed",
        lastOrderAt: item.lifecycleMarketing?.lastOrderAt ?? baseProfile.lastOrderAt ?? null,
        lastWishlistActivityAt: item.lifecycleMarketing?.lastWishlistActivityAt ?? item.wishlistUpdatedAt ?? null,
        lastMarketingEngagementAt: item.lifecycleMarketing?.lastMarketingEngagementAt ?? null,
        nextCampaignKey: item.lifecycleMarketing?.nextCampaignKey ?? "welcome_series",
        automationFlags: Array.isArray(item.lifecycleMarketing?.automationFlags)
          ? item.lifecycleMarketing.automationFlags
          : [],
      }),
    })
  })
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

async function deliverStorefrontWelcomeEmail(
  database: Kysely<unknown>,
  config: ServerConfig,
  account: CustomerAccount
) {
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
}

export async function sendQueuedStorefrontWelcomeMail(
  database: Kysely<unknown>,
  config: ServerConfig,
  customerAccountId: string
) {
  const accounts = await readCustomerAccounts(database)
  const account = accounts.find((item) => item.id === customerAccountId) ?? null

  if (!account) {
    throw new ApplicationError("Customer account could not be found.", { customerAccountId }, 404)
  }

  await deliverStorefrontWelcomeEmail(database, config, account)
}

function queueStorefrontWelcomeEmail(
  database: Kysely<unknown>,
  _config: ServerConfig,
  account: CustomerAccount,
  trigger: "first_login" | "manual" = "first_login"
) {
  void (async () => {
    try {
      const settings = await getEcommerceSettings(database)

      if (!settings.automation.autoSendWelcomeMail) {
        return
      }

      await enqueueRuntimeJob(database, {
        queueName: "notifications",
        handlerKey: "ecommerce.customer.send-welcome-mail",
        appId: "ecommerce",
        moduleKey: "customers",
        dedupeKey: `storefront-welcome:${account.id}`,
        payload: {
          customerAccountId: account.id,
          trigger,
        },
        maxAttempts: 4,
      })
    } catch (error) {
      console.error("Unable to send storefront welcome email.", error)
    }
  })()
}

async function listCustomerWelcomeMailStatuses(database: Kysely<unknown>) {
  const activeJobs = await listActiveRuntimeJobsByHandler(
    database,
    "ecommerce.customer.send-welcome-mail"
  )
  const queuedByCustomerId = new Set(
    activeJobs
      .map((job) =>
        typeof job.payload === "object" && job.payload !== null
          ? (job.payload as { customerAccountId?: unknown }).customerAccountId
          : null
      )
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  )
  const queryDatabase = asQueryDatabase(database)
  const rows = await queryDatabase
    .selectFrom(cxappTableNames.mailboxMessages)
    .select([
      "reference_id as referenceId",
      "status",
      "sent_at as sentAt",
      "failed_at as failedAt",
      "error_message as errorMessage",
      "created_at as createdAt",
      "updated_at as updatedAt",
    ])
    .where("template_code", "=", "storefront_customer_welcome")
    .where("reference_id", "is not", null)
    .orderBy("created_at", "desc")
    .execute()

  const statuses = new Map<string, CustomerWelcomeMailStatusSnapshot>()

  for (const customerAccountId of queuedByCustomerId) {
    statuses.set(customerAccountId, {
      status: "queued",
      lastAttemptAt: null,
      sentAt: null,
      failedAt: null,
      errorMessage: null,
    })
  }

  for (const row of rows) {
    const referenceId = String(row.referenceId ?? "").trim()

    if (!referenceId || statuses.has(referenceId)) {
      continue
    }

    const rawStatus = String(row.status ?? "")
    statuses.set(referenceId, {
      status:
        rawStatus === "sent"
          ? "sent"
          : rawStatus === "failed"
            ? "failed"
            : rawStatus === "queued"
              ? "queued"
              : "not_sent",
      lastAttemptAt: String(row.updatedAt ?? row.createdAt ?? "") || null,
      sentAt: row.sentAt == null ? null : String(row.sentAt),
      failedAt: row.failedAt == null ? null : String(row.failedAt),
      errorMessage: row.errorMessage == null ? null : String(row.errorMessage),
    })
  }

  return statuses
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

const suspiciousLoginActions = new Set([
  "login_failed",
  "login_locked",
  "login_blocked",
  "session_rejected",
])

function eventBelongsToCustomer(
  account: CustomerAccount,
  event: StorefrontCustomerSuspiciousLoginEvent & { actorId?: string | null; actorEmail?: string | null }
) {
  if (account.authUserId && event.actorId === account.authUserId) {
    return true
  }

  return event.actorEmail?.trim().toLowerCase() === account.email.trim().toLowerCase()
}

async function listCustomerSuspiciousLoginEvents(database: Kysely<unknown>) {
  const logs = await listActivityLogs(database, {
    category: "auth",
    limit: 500,
  })

  return logs.items
    .filter(
      (item) =>
        item.actorType === "customer" && suspiciousLoginActions.has(item.action)
    )
    .map((item) => ({
      ...storefrontCustomerSuspiciousLoginEventSchema.parse({
        id: item.id,
        action: item.action,
        level: item.level,
        message: item.message,
        ipAddress:
          typeof item.context?.ipAddress === "string" ? item.context.ipAddress : null,
        userAgent:
          typeof item.context?.userAgent === "string" ? item.context.userAgent : null,
        createdAt: item.createdAt,
      }),
      actorId: item.actorId,
      actorEmail: item.actorEmail,
    }))
}

function getCustomerSuspiciousLoginEvents(
  account: CustomerAccount,
  events: Array<
    StorefrontCustomerSuspiciousLoginEvent & {
      actorId?: string | null
      actorEmail?: string | null
    }
  >
) {
  return events
    .filter((event) => eventBelongsToCustomer(account, event))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

function getCustomerDeleteEligibility(input: {
  account: CustomerAccount
  orders: StorefrontOrder[]
  supportCases: StorefrontSupportCase[]
  orderRequests: StorefrontOrderRequest[]
}): StorefrontCustomerDeleteEligibility {
  const orderCount = input.orders.filter((item) => orderBelongsToAccount(item, input.account)).length
  const supportCaseCount = input.supportCases.filter((item) => item.customerAccountId === input.account.id).length
  const requestCount = input.orderRequests.filter((item) => item.customerAccountId === input.account.id).length
  const hasLinkedRecords = orderCount > 0 || supportCaseCount > 0 || requestCount > 0

  return storefrontCustomerDeleteEligibilitySchema.parse({
    canDelete: !hasLinkedRecords,
    hasLinkedRecords,
    orderCount,
    supportCaseCount,
    requestCount,
  })
}

function buildLifecycleAccountRecord(input: {
  account: CustomerAccount
  lifecycleState: CustomerLifecycleState
  note: string | null
  timestamp: string
}) {
  const { account, lifecycleState, note, timestamp } = input

  return customerAccountSchema.parse({
    ...account,
    isActive: lifecycleState === "active",
    lifecycleState,
    lifecycleNote: note,
    blockedAt: lifecycleState === "blocked" ? timestamp : null,
    deletedAt: lifecycleState === "deleted" ? timestamp : null,
    anonymizedAt: account.anonymizedAt,
    emailVerifiedAt: account.emailVerifiedAt,
    suspiciousLoginReviewedAt: account.suspiciousLoginReviewedAt,
    suspiciousLoginReviewNote: account.suspiciousLoginReviewNote,
    updatedAt: timestamp,
  })
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

function roundCurrencyAmount(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100
}

function deriveCommercialProfile(
  orders: StorefrontOrder[],
  portalRecord: Pick<CustomerPortalRecord, "preferences" | "wishlistProductIds" | "wishlistUpdatedAt">
): CustomerCommercialProfile {
  const paidOrders = orders.filter((item) => item.paymentStatus === "paid")
  const orderCount = paidOrders.length
  const lifetimeSpend = roundCurrencyAmount(
    paidOrders.reduce((sum, item) => sum + item.totalAmount, 0)
  )
  const lastOrderAt =
    paidOrders
      .map((item) => item.updatedAt)
      .sort((left, right) => right.localeCompare(left))[0] ?? null
  const daysSinceLastOrder =
    lastOrderAt == null
      ? Number.POSITIVE_INFINITY
      : (Date.now() - new Date(lastOrderAt).getTime()) / (1000 * 60 * 60 * 24)

  let segmentKey: CustomerCommercialProfile["segmentKey"] = "new_customer"
  let priceAdjustmentPercent = 0
  let promotionLabel: string | null = null

  if (orderCount >= 5 || lifetimeSpend >= 25000) {
    segmentKey = "vip"
    priceAdjustmentPercent = 5
    promotionLabel = "VIP loyalty price"
  } else if (orderCount >= 2) {
    segmentKey = "repeat_customer"
    priceAdjustmentPercent = 3
    promotionLabel = "Repeat customer price"
  }

  if (orderCount > 0 && daysSinceLastOrder >= 45 && daysSinceLastOrder < 90) {
    segmentKey = "at_risk"
    priceAdjustmentPercent = 7
    promotionLabel = "Come-back promotion"
  } else if (orderCount > 0 && daysSinceLastOrder >= 90) {
    segmentKey = "dormant"
    priceAdjustmentPercent = 10
    promotionLabel = "Win-back promotion"
  }

  if (portalRecord.preferences.marketingEmails === false && segmentKey === "new_customer") {
    promotionLabel = null
  }

  return customerCommercialProfileSchema.parse({
    segmentKey,
    orderCount,
    lifetimeSpend,
    lastOrderAt,
    priceAdjustmentPercent,
    promotionLabel,
    source: "ecommerce_rules",
  })
}

function deriveLifecycleMarketingState(
  portalRecord: Pick<
    CustomerPortalRecord,
    "preferences" | "wishlistProductIds" | "wishlistUpdatedAt" | "commercialProfile"
  >,
  commercialProfile: CustomerCommercialProfile
): CustomerLifecycleMarketingState {
  const subscribed = portalRecord.preferences.marketingEmails
  let stage: CustomerLifecycleMarketingState["stage"] = "welcome"
  let nextCampaignKey: string | null = "welcome_series"
  const automationFlags: string[] = []

  if (!subscribed) {
    stage = "suppressed"
    nextCampaignKey = null
  } else if (commercialProfile.segmentKey === "vip") {
    stage = "vip"
    nextCampaignKey = "vip_early_access"
    automationFlags.push("vip_curated_drop")
  } else if (commercialProfile.segmentKey === "at_risk" || commercialProfile.segmentKey === "dormant") {
    stage = "winback"
    nextCampaignKey = "winback_offer"
    automationFlags.push("winback_offer")
  } else if (commercialProfile.segmentKey === "repeat_customer") {
    stage = "active"
    nextCampaignKey = "repeat_purchase_cross_sell"
    automationFlags.push("cross_sell_followup")
  } else if (portalRecord.wishlistProductIds.length > 0) {
    stage = "nurture"
    nextCampaignKey = "wishlist_price_drop"
    automationFlags.push("wishlist_price_drop")
  }

  if (portalRecord.preferences.priceDropAlerts && portalRecord.wishlistProductIds.length > 0) {
    automationFlags.push("price_drop_watch")
  }

  return customerLifecycleMarketingStateSchema.parse({
    stage,
    emailSubscriptionStatus: subscribed ? "subscribed" : "unsubscribed",
    lastOrderAt: commercialProfile.lastOrderAt,
    lastWishlistActivityAt: portalRecord.wishlistUpdatedAt,
    lastMarketingEngagementAt: null,
    nextCampaignKey,
    automationFlags,
  })
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
  const commercialProfile = deriveCommercialProfile([], {
    preferences: {
      orderUpdates: true,
      wishlistAlerts: true,
      priceDropAlerts: true,
      marketingEmails: true,
      smsAlerts: false,
    },
    wishlistProductIds: [],
    wishlistUpdatedAt: null,
  })
  const lifecycleMarketing = deriveLifecycleMarketingState(
    {
      preferences: {
        orderUpdates: true,
        wishlistAlerts: true,
        priceDropAlerts: true,
        marketingEmails: true,
        smsAlerts: false,
      },
      wishlistProductIds: [],
      wishlistUpdatedAt: null,
      commercialProfile,
    },
    commercialProfile
  )

  return customerPortalRecordSchema.parse({
    id: `customer-portal:${account.id}`,
    customerAccountId: account.id,
    wishlistProductIds: [],
    wishlistUpdatedAt: null,
    coupons: [
      {
        id: `coupon:${account.id}:welcome`,
        code: welcomeCouponCode,
        title: "Welcome savings",
        summary: "Use this on your next checkout for a first-order discount.",
        discountLabel: "10% off",
        discountType: "percentage",
        discountValue: 10,
        maxDiscountAmount: 500,
        minimumOrderAmount: 1499,
        expiresAt: null,
        status: "active",
        usageLimit: 1,
        usageCount: 0,
        reservedAt: null,
        reservedOrderId: null,
        usedAt: null,
      },
      {
        id: `coupon:${account.id}:shipping`,
        code: `SHIPFREE-${codeBase}`,
        title: "Free shipping",
        summary: "Unlock complimentary shipping on qualifying carts.",
        discountLabel: "Free shipping",
        discountType: "free_shipping",
        discountValue: 0,
        maxDiscountAmount: null,
        minimumOrderAmount: 1999,
        expiresAt: null,
        status: "active",
        usageLimit: 1,
        usageCount: 0,
        reservedAt: null,
        reservedOrderId: null,
        usedAt: null,
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
    commercialProfile,
    lifecycleMarketing,
    createdAt: now,
    updatedAt: now,
  })
}

function upsertPortalRecord(
  records: CustomerPortalRecord[],
  updatedRecord: CustomerPortalRecord
) {
  return [
    updatedRecord,
    ...records.filter((item) => item.customerAccountId !== updatedRecord.customerAccountId),
  ]
}

export async function listWelcomeMailProducts(database: Kysely<unknown>) {
  const products = (await readProjectedStorefrontProducts(database))
    .filter((item) => item.isActive)
    .map((item) => toStorefrontProductCard(item))

  const newArrivals = products.filter((item) => item.isNewArrival)
  return (newArrivals.length > 0 ? newArrivals : products).slice(0, 4)
}

async function ensureCustomerPortalRecord(
  database: Kysely<unknown>,
  account: CustomerAccount
) {
  return runExclusiveByKey(customerPortalRecordLocks, account.id, async () => {
    const records = await readCustomerPortalRecords(database)
    const matchingRecords = sortRecordsByCreatedAtAndId(
      records.filter((item) => item.customerAccountId === account.id)
    )
    const existing = matchingRecords[0] ?? null

    if (existing) {
      if (matchingRecords.length > 1) {
        await writeCustomerPortalRecords(
          database,
          upsertPortalRecord(records, existing)
        )
      }

      return existing
    }

    const record = createDefaultPortalRecord(account)
    await writeCustomerPortalRecords(database, [record, ...records])
    return record
  })
}

function normalizeCouponStatus(coupon: CustomerPortalCoupon, now: string) {
  if (coupon.expiresAt && coupon.expiresAt <= now) {
    return "expired" as const
  }

  return coupon.status
}

async function updateCustomerPortalRecord(
  database: Kysely<unknown>,
  updatedRecord: CustomerPortalRecord
) {
  await runExclusiveByKey(
    customerPortalRecordLocks,
    updatedRecord.customerAccountId,
    async () => {
      const records = await readCustomerPortalRecords(database)
      await writeCustomerPortalRecords(database, upsertPortalRecord(records, updatedRecord))
    }
  )
}

export async function reserveCustomerPortalCoupon(
  database: Kysely<unknown>,
  account: CustomerAccount,
  input: {
    couponCode: string
    subtotalAmount: number
    shippingAmount: number
    orderId: string
  }
) {
  const portalRecord = await ensureCustomerPortalRecord(database, account)
  const now = new Date().toISOString()
  const coupon = portalRecord.coupons.find(
    (item) => item.code.trim().toUpperCase() === input.couponCode.trim().toUpperCase()
  )

  if (!coupon) {
    throw new ApplicationError("Coupon code could not be found for this customer account.", {}, 404)
  }

  const normalizedStatus = normalizeCouponStatus(coupon, now)

  if (normalizedStatus === "expired") {
    const updatedRecord = customerPortalRecordSchema.parse({
      ...portalRecord,
      coupons: portalRecord.coupons.map((item) =>
        item.id === coupon.id ? { ...item, status: "expired" } : item
      ),
      updatedAt: now,
    })
    await updateCustomerPortalRecord(database, updatedRecord)
    throw new ApplicationError("Coupon code has expired.", { couponCode: coupon.code }, 409)
  }

  if (normalizedStatus === "used" || coupon.usageCount >= coupon.usageLimit) {
    throw new ApplicationError("Coupon code has already been used.", { couponCode: coupon.code }, 409)
  }

  if (normalizedStatus === "reserved" && coupon.reservedOrderId !== input.orderId) {
    throw new ApplicationError(
      "Coupon code is already reserved for another pending order.",
      { couponCode: coupon.code },
      409
    )
  }

  if (input.subtotalAmount < coupon.minimumOrderAmount) {
    throw new ApplicationError(
      "Coupon minimum order amount has not been reached.",
      {
        couponCode: coupon.code,
        minimumOrderAmount: coupon.minimumOrderAmount,
        subtotalAmount: input.subtotalAmount,
      },
      409
    )
  }

  const discountAmount =
    coupon.discountType === "free_shipping"
      ? Math.round(Math.max(0, input.shippingAmount) * 100) / 100
      : coupon.discountType === "fixed_amount"
        ? Math.round(Math.min(input.subtotalAmount, coupon.discountValue) * 100) / 100
        : Math.round(
            Math.min(
              input.subtotalAmount,
              coupon.maxDiscountAmount ?? Number.POSITIVE_INFINITY,
              (input.subtotalAmount * coupon.discountValue) / 100
            ) * 100
          ) / 100

  if (discountAmount <= 0) {
    throw new ApplicationError("Coupon code does not apply to this checkout.", { couponCode: coupon.code }, 409)
  }

  const updatedRecord = customerPortalRecordSchema.parse({
    ...portalRecord,
    coupons: portalRecord.coupons.map((item) =>
      item.id === coupon.id
        ? {
            ...item,
            status: "reserved",
            reservedAt: now,
            reservedOrderId: input.orderId,
          }
        : item
    ),
    updatedAt: now,
  })

  await updateCustomerPortalRecord(database, updatedRecord)

  return {
    coupon: updatedRecord.coupons.find((item) => item.id === coupon.id)!,
    discountAmount,
  }
}

export async function releaseCustomerPortalCoupon(
  database: Kysely<unknown>,
  account: CustomerAccount | null,
  couponId: string | null | undefined,
  orderId: string | null | undefined
) {
  if (!account || !couponId || !orderId) {
    return
  }

  const portalRecord = await ensureCustomerPortalRecord(database, account)
  const coupon = portalRecord.coupons.find((item) => item.id === couponId)

  if (!coupon || coupon.status !== "reserved" || coupon.reservedOrderId !== orderId) {
    return
  }

  const now = new Date().toISOString()
  const updatedRecord = customerPortalRecordSchema.parse({
    ...portalRecord,
    coupons: portalRecord.coupons.map((item) =>
      item.id === couponId
        ? {
            ...item,
            status: item.expiresAt && item.expiresAt <= now ? "expired" : "active",
            reservedAt: null,
            reservedOrderId: null,
          }
        : item
    ),
    updatedAt: now,
  })

  await updateCustomerPortalRecord(database, updatedRecord)
}

export async function consumeCustomerPortalCoupon(
  database: Kysely<unknown>,
  account: CustomerAccount | null,
  couponId: string | null | undefined,
  orderId: string | null | undefined
) {
  if (!account || !couponId || !orderId) {
    return
  }

  const portalRecord = await ensureCustomerPortalRecord(database, account)
  const coupon = portalRecord.coupons.find((item) => item.id === couponId)

  if (!coupon) {
    return
  }

  const now = new Date().toISOString()
  const updatedRecord = customerPortalRecordSchema.parse({
    ...portalRecord,
    coupons: portalRecord.coupons.map((item) =>
      item.id === couponId && item.reservedOrderId === orderId
        ? {
            ...item,
            status: "used",
            usageCount: item.usageCount + 1,
            reservedAt: null,
            reservedOrderId: null,
            usedAt: now,
          }
        : item
    ),
    updatedAt: now,
  })

  await updateCustomerPortalRecord(database, updatedRecord)
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
    emailVerifiedAt: account.emailVerifiedAt,
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
    readProjectedStorefrontProducts(database),
    readOrders(database),
  ])

  const wishlist = portalRecord.wishlistProductIds
    .map((productId) => coreProducts.find((item) => item.id === productId) ?? null)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.isActive)
    .map(toStorefrontProductCard)

  const customerOrders = orders.filter((item) => orderBelongsToAccount(item, account))
  const commercialProfile = deriveCommercialProfile(customerOrders, portalRecord)
  const lifecycleMarketing = deriveLifecycleMarketingState(
    {
      preferences: portalRecord.preferences,
      wishlistProductIds: portalRecord.wishlistProductIds,
      wishlistUpdatedAt: portalRecord.wishlistUpdatedAt,
      commercialProfile,
    },
    commercialProfile
  )

  return customerPortalResponseSchema.parse({
    profile,
    wishlist,
    coupons: portalRecord.coupons,
    giftCards: portalRecord.giftCards,
    rewards: portalRecord.rewards,
    preferences: portalRecord.preferences,
    commercialProfile,
    lifecycleMarketing,
    stats: {
      orderCount: customerOrders.length,
      wishlistCount: wishlist.length,
      activeCouponCount: portalRecord.coupons.filter((item) => item.status === "active").length,
      activeGiftCardCount: portalRecord.giftCards.filter((item) => item.status === "active").length,
    },
  })
}

export async function getCustomerCommercialContext(
  database: Kysely<unknown>,
  account: CustomerAccount
) {
  const [portalRecord, orders] = await Promise.all([
    ensureCustomerPortalRecord(database, account),
    readOrders(database),
  ])
  const customerOrders = orders.filter((item) => orderBelongsToAccount(item, account))
  const commercialProfile = deriveCommercialProfile(customerOrders, portalRecord)
  const lifecycleMarketing = deriveLifecycleMarketingState(
    {
      preferences: portalRecord.preferences,
      wishlistProductIds: portalRecord.wishlistProductIds,
      wishlistUpdatedAt: portalRecord.wishlistUpdatedAt,
      commercialProfile,
    },
    commercialProfile
  )

  return {
    portalRecord,
    customerOrders,
    commercialProfile,
    lifecycleMarketing,
  }
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
  config: ServerConfig,
  user: AuthUser
) {
  const lockKey = user.id.trim() || user.email.trim().toLowerCase()

  return runExclusiveByKey(customerAccountBootstrapLocks, lockKey, async () => {
    const accounts = await readCustomerAccounts(database)
    const now = new Date().toISOString()
    const matchingAccounts = sortRecordsByCreatedAtAndId(
      accounts.filter(
        (item) =>
          item.authUserId === user.id ||
          item.email.toLowerCase() === user.email.toLowerCase()
      )
    )
    const matchingAccount = matchingAccounts[0] ?? null

    if (matchingAccount) {
      const isFirstLogin = !matchingAccount.lastLoginAt
      const nextPhoneNumber = user.phoneNumber ?? matchingAccount.phoneNumber
      const nextCompanyName =
        matchingAccount.companyName ?? normalizeOptionalString(user.organizationName)
      const nextLifecycleState = user.isActive
        ? matchingAccount.lifecycleState === "active"
          ? "active"
          : matchingAccount.lifecycleState
        : matchingAccount.lifecycleState === "active"
          ? "blocked"
          : matchingAccount.lifecycleState
      const shouldRefreshLastLoginAt = shouldRefreshCustomerActivityTimestamp(
        matchingAccount.lastLoginAt,
        now
      )
      const duplicateAccountIds = new Set(
        matchingAccounts
          .filter((item) => item.id !== matchingAccount.id)
          .map((item) => item.id)
      )
      const requiresWrite =
        duplicateAccountIds.size > 0 ||
        matchingAccount.authUserId !== user.id ||
        matchingAccount.email !== user.email ||
        matchingAccount.phoneNumber !== nextPhoneNumber ||
        matchingAccount.displayName !== user.displayName ||
        matchingAccount.companyName !== nextCompanyName ||
        matchingAccount.isActive !== user.isActive ||
        matchingAccount.lifecycleState !== nextLifecycleState ||
        shouldRefreshLastLoginAt

      const updatedAccount = customerAccountSchema.parse({
        ...matchingAccount,
        authUserId: user.id,
        email: user.email,
        phoneNumber: nextPhoneNumber,
        displayName: user.displayName,
        companyName: nextCompanyName,
        isActive: user.isActive,
        lifecycleState: nextLifecycleState,
        lifecycleNote: matchingAccount.lifecycleNote ?? null,
        blockedAt: matchingAccount.blockedAt ?? null,
        deletedAt: matchingAccount.deletedAt ?? null,
        anonymizedAt: matchingAccount.anonymizedAt ?? null,
        emailVerifiedAt: matchingAccount.emailVerifiedAt ?? matchingAccount.createdAt ?? now,
        suspiciousLoginReviewedAt: matchingAccount.suspiciousLoginReviewedAt ?? null,
        suspiciousLoginReviewNote: matchingAccount.suspiciousLoginReviewNote ?? null,
        lastLoginAt: shouldRefreshLastLoginAt ? now : matchingAccount.lastLoginAt,
        updatedAt: requiresWrite ? now : matchingAccount.updatedAt,
      })

      if (requiresWrite) {
        await writeCustomerAccounts(
          database,
          accounts
            .filter((item) => !duplicateAccountIds.has(item.id))
            .map((item) => (item.id === updatedAccount.id ? updatedAccount : item))
        )
      }

      if (isFirstLogin) {
        queueStorefrontWelcomeEmail(database, config, updatedAccount)
      }

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
      emailVerifiedAt: now,
      suspiciousLoginReviewedAt: null,
      suspiciousLoginReviewNote: null,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    })

    await writeCustomerAccounts(database, [account, ...accounts])
    queueStorefrontWelcomeEmail(database, config, account)
    await ensureCustomerPortalRecord(database, account)
    return account
  })
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
  await authService.assertVerifiedRegistrationEmail(
    parsed.emailVerificationId,
    parsed.email
  )
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
  const addressLine1 = normalizeOptionalString(parsed.addressLine1)
  const city = normalizeOptionalString(parsed.city)
  const state = normalizeOptionalString(parsed.state)
  const country = normalizeOptionalString(parsed.country)
  const pincode = normalizeOptionalString(parsed.pincode)
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
        addresses:
          addressLine1 && city && state && country && pincode
            ? [
                {
                  addressTypeId: "address-type:shipping",
                  addressLine1,
                  addressLine2: parsed.addressLine2 ?? "",
                  cityId: city,
                  districtId: null,
                  stateId: state,
                  countryId: country,
                  pincodeId: pincode,
                  latitude: null,
                  longitude: null,
                  isDefault: true,
                },
              ]
            : [],
        emails: [{ email: parsed.email, emailType: "primary", isPrimary: true }],
        phones: [{ phoneNumber: parsed.phoneNumber, phoneType: "mobile", isPrimary: true }],
        bankAccounts: [],
        gstDetails: gstin && state ? [{ gstin, state, isDefault: true }] : [],
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
    emailVerifiedAt: timestamp,
    suspiciousLoginReviewedAt: null,
    suspiciousLoginReviewNote: null,
    lastLoginAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await writeCustomerAccounts(database, [account, ...accounts])
  await ensureCustomerPortalRecord(database, account)
  await authService.consumeVerifiedRegistrationEmail(parsed.emailVerificationId)

  return buildCustomerProfile(database, account)
}

export async function sendStorefrontCustomerWelcomeMail(
  database: Kysely<unknown>,
  config: ServerConfig,
  customerAccountId: string
) {
  try {
    const accounts = await readCustomerAccounts(database)
    const account = accounts.find((item) => item.id === customerAccountId) ?? null

    if (!account) {
      throw new ApplicationError("Customer account could not be found.", { customerAccountId }, 404)
    }

    await enqueueRuntimeJob(database, {
      queueName: "notifications",
      handlerKey: "ecommerce.customer.send-welcome-mail",
      appId: "ecommerce",
      moduleKey: "customers",
      dedupeKey: `storefront-welcome:${account.id}`,
      payload: {
        customerAccountId: account.id,
        trigger: "manual",
      },
      maxAttempts: 4,
    })

    return storefrontCustomerWelcomeMailSendResponseSchema.parse({
      customer: await getStorefrontCustomerAccount(database, customerAccountId),
      deliveryStatus: "queued",
      message: "Welcome mail was queued for background delivery.",
    })
  } catch (error) {
    return storefrontCustomerWelcomeMailSendResponseSchema.parse({
      customer: await getStorefrontCustomerAccount(database, customerAccountId),
      deliveryStatus: "failed",
      message:
        error instanceof Error ? error.message : "Welcome mail send failed.",
    })
  }
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
  const account = await ensureCustomerAccountForUser(database, config, user)

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

  if (!account.emailVerifiedAt) {
    throw new ApplicationError(
      "Verify this email address before using the customer portal.",
      { customerAccountId: account.id },
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
  const commercialProfile = deriveCommercialProfile([], {
    preferences: record.preferences,
    wishlistProductIds: nextWishlistProductIds,
    wishlistUpdatedAt: new Date().toISOString(),
  })
  const updatedRecord = customerPortalRecordSchema.parse({
    ...record,
    wishlistProductIds: nextWishlistProductIds,
    wishlistUpdatedAt: new Date().toISOString(),
    commercialProfile,
    lifecycleMarketing: deriveLifecycleMarketingState(
      {
        preferences: record.preferences,
        wishlistProductIds: nextWishlistProductIds,
        wishlistUpdatedAt: new Date().toISOString(),
        commercialProfile,
      },
      commercialProfile
    ),
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
  welcomeMailStatus: CustomerWelcomeMailStatusSnapshot | null
  suspiciousLoginEvents: Array<
    StorefrontCustomerSuspiciousLoginEvent & {
      actorId?: string | null
      actorEmail?: string | null
    }
  >
}): StorefrontCustomerAdminView {
  const { account, orders, supportCases, orderRequests, welcomeMailStatus, suspiciousLoginEvents } = input
  const matchingOrders = orders.filter((item) => orderBelongsToAccount(item, account))
  const matchingSupportCases = supportCases.filter(
    (item) => item.customerAccountId === account.id
  )
  const matchingRequests = orderRequests.filter((item) => item.customerAccountId === account.id)
  const matchingSuspiciousEvents = getCustomerSuspiciousLoginEvents(
    account,
    suspiciousLoginEvents
  )
  const suspiciousLoginOpenCount =
    account.suspiciousLoginReviewedAt == null
      ? matchingSuspiciousEvents.length
      : matchingSuspiciousEvents.filter(
          (item) => item.createdAt > account.suspiciousLoginReviewedAt!
        ).length
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
    emailVerifiedAt: account.emailVerifiedAt,
    lastLoginAt: account.lastLoginAt,
    orderCount: matchingOrders.length,
    supportCaseCount: matchingSupportCases.length,
    requestCount: matchingRequests.length,
    suspiciousLoginOpenCount,
    latestSuspiciousLoginAt: matchingSuspiciousEvents[0]?.createdAt ?? null,
    suspiciousLoginReviewedAt: account.suspiciousLoginReviewedAt,
    suspiciousLoginReviewNote: account.suspiciousLoginReviewNote,
    welcomeMailStatus: welcomeMailStatus?.status ?? "not_sent",
    welcomeMailLastAttemptAt: welcomeMailStatus?.lastAttemptAt ?? null,
    welcomeMailSentAt: welcomeMailStatus?.sentAt ?? null,
    welcomeMailFailedAt: welcomeMailStatus?.failedAt ?? null,
    welcomeMailErrorMessage: welcomeMailStatus?.errorMessage ?? null,
    lastOrderAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

export async function getStorefrontCustomerOperationsReport(database: Kysely<unknown>) {
  const [accounts, orders, supportCases, orderRequests, welcomeMailStatuses, suspiciousLoginEvents] = await Promise.all([
    readCustomerAccounts(database),
    readOrders(database),
    readSupportCases(database),
    readOrderRequests(database),
    listCustomerWelcomeMailStatuses(database),
    listCustomerSuspiciousLoginEvents(database),
  ])

  const items = accounts
    .map((account) =>
      buildCustomerAdminView({
        account,
        orders,
        supportCases,
        orderRequests,
        welcomeMailStatus: welcomeMailStatuses.get(account.id) ?? null,
        suspiciousLoginEvents,
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
      verifiedCount: items.filter((item) => Boolean(item.emailVerifiedAt)).length,
      suspiciousReviewCount: items.filter((item) => item.suspiciousLoginOpenCount > 0).length,
    },
    items,
  })
}

export async function getStorefrontCustomerSegmentationReport(
  database: Kysely<unknown>
): Promise<StorefrontCustomerSegmentReport> {
  const accounts = await readCustomerAccounts(database)

  const items = await Promise.all(
    accounts.map(async (account) => {
      const { commercialProfile } = await getCustomerCommercialContext(database, account)

      return {
        customerAccountId: account.id,
        displayName: account.displayName,
        email: account.email,
        segmentKey: commercialProfile.segmentKey,
        orderCount: commercialProfile.orderCount,
        lifetimeSpend: commercialProfile.lifetimeSpend,
        priceAdjustmentPercent: commercialProfile.priceAdjustmentPercent,
        promotionLabel: commercialProfile.promotionLabel,
        lastOrderAt: commercialProfile.lastOrderAt,
      }
    })
  )
  return storefrontCustomerSegmentReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalCustomers: items.length,
      newCustomerCount: items.filter((item) => item.segmentKey === "new_customer").length,
      repeatCustomerCount: items.filter((item) => item.segmentKey === "repeat_customer").length,
      vipCount: items.filter((item) => item.segmentKey === "vip").length,
      atRiskCount: items.filter((item) => item.segmentKey === "at_risk").length,
      dormantCount: items.filter((item) => item.segmentKey === "dormant").length,
    },
    items: items.sort((left, right) => left.displayName.localeCompare(right.displayName)),
  })
}

export async function getStorefrontLifecycleMarketingReport(
  database: Kysely<unknown>
): Promise<StorefrontLifecycleMarketingReport> {
  const accounts = await readCustomerAccounts(database)
  const items = await Promise.all(
    accounts.map(async (account) => {
      const { lifecycleMarketing } = await getCustomerCommercialContext(database, account)

      return {
        customerAccountId: account.id,
        displayName: account.displayName,
        email: account.email,
        stage: lifecycleMarketing.stage,
        emailSubscriptionStatus: lifecycleMarketing.emailSubscriptionStatus,
        nextCampaignKey: lifecycleMarketing.nextCampaignKey,
        automationFlags: lifecycleMarketing.automationFlags,
        lastOrderAt: lifecycleMarketing.lastOrderAt,
        lastWishlistActivityAt: lifecycleMarketing.lastWishlistActivityAt,
      }
    })
  )

  return storefrontLifecycleMarketingReportSchema.parse({
    generatedAt: new Date().toISOString(),
    summary: {
      totalCustomers: items.length,
      subscribedCount: items.filter((item) => item.emailSubscriptionStatus === "subscribed").length,
      winbackCount: items.filter((item) => item.stage === "winback").length,
      vipJourneyCount: items.filter((item) => item.stage === "vip").length,
      suppressedCount: items.filter((item) => item.stage === "suppressed").length,
    },
    items: items.sort((left, right) => left.displayName.localeCompare(right.displayName)),
  })
}

export async function getStorefrontCustomerAccount(
  database: Kysely<unknown>,
  customerAccountId: string
) {
  const report = await getStorefrontCustomerOperationsReport(database)
  const accounts = await readCustomerAccounts(database)
  const item = report.items.find((entry) => entry.id === customerAccountId) ?? null
  const account = accounts.find((entry) => entry.id === customerAccountId) ?? null

  if (!item || !account) {
    throw new ApplicationError("Customer account could not be found.", { customerAccountId }, 404)
  }

  const suspiciousLoginEvents = getCustomerSuspiciousLoginEvents(
    account,
    await listCustomerSuspiciousLoginEvents(database)
  )

  return storefrontCustomerAdminResponseSchema.parse({
    item,
    suspiciousLoginEvents,
  })
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
      emailVerifiedAt: existing.emailVerifiedAt,
      suspiciousLoginReviewedAt: existing.suspiciousLoginReviewedAt,
      suspiciousLoginReviewNote: existing.suspiciousLoginReviewNote,
      updatedAt: timestamp,
    })
  } else {
    const lifecycleState: CustomerLifecycleState =
      parsed.action === "activate"
        ? "active"
        : parsed.action === "block"
          ? "blocked"
          : "deleted"

    nextAccount = buildLifecycleAccountRecord({
      account: existing,
      lifecycleState,
      note: parsed.note,
      timestamp,
    })
  }

  await writeCustomerAccounts(
    database,
    accounts.map((item) => (item.id === nextAccount.id ? nextAccount : item))
  )
  await syncCustomerAuthState(database, nextAccount)

  return getStorefrontCustomerAccount(database, nextAccount.id)
}

export async function deactivateAuthenticatedCustomerAccount(
  database: Kysely<unknown>,
  config: ServerConfig,
  token: string
) {
  const account = await resolveAuthenticatedCustomerAccount(database, config, token)
  const accounts = await readCustomerAccounts(database)
  const existing = accounts.find((item) => item.id === account.id) ?? null

  if (!existing) {
    throw new ApplicationError("Customer account could not be found.", { customerAccountId: account.id }, 404)
  }

  const nextAccount = buildLifecycleAccountRecord({
    account: existing,
    lifecycleState: "deleted",
    note: "Customer requested account deletion from the customer portal.",
    timestamp: new Date().toISOString(),
  })

  await writeCustomerAccounts(
    database,
    accounts.map((item) => (item.id === nextAccount.id ? nextAccount : item))
  )
  await syncCustomerAuthState(database, nextAccount)

  return storefrontCustomerSelfDeactivateResponseSchema.parse({
    deactivated: true,
    customerAccountId: nextAccount.id,
  })
}

export async function permanentlyDeleteStorefrontCustomerAccount(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsed = storefrontCustomerPermanentDeletePayloadSchema.parse(payload)
  const [accounts, portalRecords, orders, supportCases, orderRequests] = await Promise.all([
    readCustomerAccounts(database),
    readCustomerPortalRecords(database),
    readOrders(database),
    readSupportCases(database),
    readOrderRequests(database),
  ])
  const existing = accounts.find((item) => item.id === parsed.customerAccountId) ?? null

  if (!existing) {
    throw new ApplicationError(
      "Customer account could not be found.",
      { customerAccountId: parsed.customerAccountId },
      404
    )
  }

  const eligibility = getCustomerDeleteEligibility({
    account: existing,
    orders,
    supportCases,
    orderRequests,
  })

  if (!eligibility.canDelete) {
    throw new ApplicationError(
      "Only customers with no linked orders, support cases, or requests can be permanently deleted.",
      {
        customerAccountId: existing.id,
        note: parsed.note,
        ...eligibility,
      },
      409
    )
  }

  await writeCustomerAccounts(
    database,
    accounts.filter((item) => item.id !== existing.id)
  )
  await writeCustomerPortalRecords(
    database,
    portalRecords.filter((item) => item.customerAccountId !== existing.id)
  )

  const authRepository = new AuthRepository(database)
  const mailboxRepository = new MailboxRepository(database)

  if (existing.authUserId) {
    await authRepository.deleteUser(existing.authUserId)
  }

  await mailboxRepository.deleteMessagesByReferenceId(existing.id)

  return storefrontCustomerPermanentDeleteResponseSchema.parse({
    deleted: true,
    customerAccountId: existing.id,
  })
}

export async function markStorefrontCustomerSecurityReview(
  database: Kysely<unknown>,
  payload: unknown
) {
  const parsed = storefrontCustomerSecurityReviewPayloadSchema.parse(payload)
  const accounts = await readCustomerAccounts(database)
  const existing = accounts.find((item) => item.id === parsed.customerAccountId) ?? null

  if (!existing) {
    throw new ApplicationError(
      "Customer account could not be found.",
      { customerAccountId: parsed.customerAccountId },
      404
    )
  }

  const updatedAccount = customerAccountSchema.parse({
    ...existing,
    suspiciousLoginReviewedAt: new Date().toISOString(),
    suspiciousLoginReviewNote: parsed.note,
    updatedAt: new Date().toISOString(),
  })

  await writeCustomerAccounts(
    database,
    accounts.map((item) => (item.id === updatedAccount.id ? updatedAccount : item))
  )

  return getStorefrontCustomerAccount(database, updatedAccount.id)
}
