import { z } from "zod"

import {
  contactAddressSchema,
  contactAddressInputSchema,
  contactBankAccountSchema,
  contactBankAccountInputSchema,
  contactEmailInputSchema,
  contactEmailSchema,
  contactGstDetailSchema,
  contactGstDetailInputSchema,
  contactPhoneInputSchema,
  contactPhoneSchema,
} from "../../../core/shared/schemas/contact.js"
import { commonModuleItemSchema } from "../../../core/shared/schemas/common-modules.js"
import { storefrontProductCardSchema } from "./catalog.js"

export const customerLifecycleStateSchema = z.enum([
  "active",
  "blocked",
  "deleted",
  "anonymized",
])

export const storefrontCustomerSuspiciousLoginEventSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["login_failed", "login_locked", "login_blocked", "session_rejected"]),
  level: z.enum(["info", "warn", "error"]),
  message: z.string().min(1),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string().min(1),
})

export const customerAccountSchema = z.object({
  id: z.string().min(1),
  authUserId: z.string().min(1).nullable().default(null),
  coreContactId: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().min(1),
  displayName: z.string().min(1),
  companyName: z.string().nullable(),
  gstin: z.string().nullable(),
  isActive: z.boolean(),
  lifecycleState: customerLifecycleStateSchema.default("active"),
  lifecycleNote: z.string().nullable().default(null),
  blockedAt: z.string().nullable().default(null),
  deletedAt: z.string().nullable().default(null),
  anonymizedAt: z.string().nullable().default(null),
  emailVerifiedAt: z.string().nullable().default(null),
  suspiciousLoginReviewedAt: z.string().nullable().default(null),
  suspiciousLoginReviewNote: z.string().nullable().default(null),
  lastLoginAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const customerProfileSchema = z.object({
  id: z.string().min(1),
  authUserId: z.string().min(1).nullable(),
  coreContactId: z.string().min(1),
  contactTypeId: z.string().min(1).nullable(),
  email: z.email(),
  primaryEmail: z.string().nullable(),
  phoneNumber: z.string().min(1),
  primaryPhone: z.string().nullable(),
  displayName: z.string().min(1),
  companyName: z.string().nullable(),
  legalName: z.string().nullable(),
  gstin: z.string().nullable(),
  website: z.string().nullable(),
  isActive: z.boolean(),
  lifecycleState: customerLifecycleStateSchema.default("active"),
  lifecycleNote: z.string().nullable().default(null),
  blockedAt: z.string().nullable().default(null),
  deletedAt: z.string().nullable().default(null),
  anonymizedAt: z.string().nullable().default(null),
  emailVerifiedAt: z.string().nullable().default(null),
  addresses: z.array(contactAddressSchema),
  emails: z.array(contactEmailSchema),
  phones: z.array(contactPhoneSchema),
  bankAccounts: z.array(contactBankAccountSchema),
  gstDetails: z.array(contactGstDetailSchema),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const customerProfileLookupResponseSchema = z.object({
  addressTypes: z.array(commonModuleItemSchema),
  bankNames: z.array(commonModuleItemSchema),
  countries: z.array(commonModuleItemSchema),
  states: z.array(commonModuleItemSchema),
  districts: z.array(commonModuleItemSchema),
  cities: z.array(commonModuleItemSchema),
  pincodes: z.array(commonModuleItemSchema),
})

export const customerPortalPreferencesSchema = z.object({
  orderUpdates: z.boolean().default(true),
  wishlistAlerts: z.boolean().default(true),
  priceDropAlerts: z.boolean().default(true),
  marketingEmails: z.boolean().default(true),
  smsAlerts: z.boolean().default(false),
})

export const customerCommercialSegmentSchema = z.enum([
  "new_customer",
  "repeat_customer",
  "vip",
  "at_risk",
  "dormant",
])

export const customerCommercialProfileSchema = z.object({
  segmentKey: customerCommercialSegmentSchema,
  orderCount: z.number().int().min(0),
  lifetimeSpend: z.number().finite().nonnegative(),
  lastOrderAt: z.string().nullable(),
  priceAdjustmentPercent: z.number().finite(),
  promotionLabel: z.string().nullable(),
  source: z.enum(["ecommerce_rules", "frappe_enrichment"]).default("ecommerce_rules"),
})

export const customerLifecycleMarketingStageSchema = z.enum([
  "welcome",
  "active",
  "nurture",
  "vip",
  "winback",
  "suppressed",
])

export const customerLifecycleMarketingStateSchema = z.object({
  stage: customerLifecycleMarketingStageSchema,
  emailSubscriptionStatus: z.enum(["subscribed", "unsubscribed", "suppressed"]),
  lastOrderAt: z.string().nullable(),
  lastWishlistActivityAt: z.string().nullable(),
  lastMarketingEngagementAt: z.string().nullable(),
  nextCampaignKey: z.string().nullable(),
  automationFlags: z.array(z.string().min(1)),
})

export const customerPortalCouponSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  discountLabel: z.string().min(1),
  discountType: z.enum(["percentage", "fixed_amount", "free_shipping"]).default("percentage"),
  discountValue: z.number().finite().nonnegative().default(0),
  maxDiscountAmount: z.number().finite().nonnegative().nullable().default(null),
  minimumOrderAmount: z.number().finite(),
  expiresAt: z.string().nullable(),
  status: z.enum(["active", "reserved", "used", "expired"]).default("active"),
  usageLimit: z.number().int().min(1).default(1),
  usageCount: z.number().int().min(0).default(0),
  reservedAt: z.string().nullable().default(null),
  reservedOrderId: z.string().nullable().default(null),
  usedAt: z.string().nullable().default(null),
})

export const customerPortalGiftCardSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  balanceAmount: z.number().finite(),
  expiresAt: z.string().nullable(),
  status: z.enum(["active", "used", "expired"]),
})

export const customerRewardActivitySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["signup", "order", "bonus", "gift-card", "coupon"]),
  label: z.string().min(1),
  summary: z.string().min(1),
  points: z.number().int(),
  createdAt: z.string().min(1),
})

export const customerRewardsSchema = z.object({
  tier: z.enum(["bronze", "silver", "gold", "platinum"]),
  pointsBalance: z.number().int().min(0),
  lifetimePoints: z.number().int().min(0),
  nextTier: z.enum(["bronze", "silver", "gold", "platinum"]).nullable(),
  pointsToNextTier: z.number().int().min(0),
  activities: z.array(customerRewardActivitySchema),
})

export const customerPortalRecordSchema = z.object({
  id: z.string().min(1),
  customerAccountId: z.string().min(1),
  wishlistProductIds: z.array(z.string().min(1)),
  wishlistUpdatedAt: z.string().nullable().default(null),
  coupons: z.array(customerPortalCouponSchema),
  giftCards: z.array(customerPortalGiftCardSchema),
  rewards: customerRewardsSchema,
  preferences: customerPortalPreferencesSchema,
  commercialProfile: customerCommercialProfileSchema,
  lifecycleMarketing: customerLifecycleMarketingStateSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const customerPortalStatsSchema = z.object({
  orderCount: z.number().int().min(0),
  wishlistCount: z.number().int().min(0),
  activeCouponCount: z.number().int().min(0),
  activeGiftCardCount: z.number().int().min(0),
})

export const customerPortalResponseSchema = z.object({
  profile: customerProfileSchema,
  wishlist: z.array(storefrontProductCardSchema),
  coupons: z.array(customerPortalCouponSchema),
  giftCards: z.array(customerPortalGiftCardSchema),
  rewards: customerRewardsSchema,
  preferences: customerPortalPreferencesSchema,
  commercialProfile: customerCommercialProfileSchema,
  lifecycleMarketing: customerLifecycleMarketingStateSchema,
  stats: customerPortalStatsSchema,
})

export const storefrontCustomerSegmentItemSchema = z.object({
  customerAccountId: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  segmentKey: customerCommercialSegmentSchema,
  orderCount: z.number().int().min(0),
  lifetimeSpend: z.number().finite().nonnegative(),
  priceAdjustmentPercent: z.number().finite(),
  promotionLabel: z.string().nullable(),
  lastOrderAt: z.string().nullable(),
})

export const storefrontCustomerSegmentReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    totalCustomers: z.number().int().min(0),
    newCustomerCount: z.number().int().min(0),
    repeatCustomerCount: z.number().int().min(0),
    vipCount: z.number().int().min(0),
    atRiskCount: z.number().int().min(0),
    dormantCount: z.number().int().min(0),
  }),
  items: z.array(storefrontCustomerSegmentItemSchema),
})

export const storefrontLifecycleMarketingItemSchema = z.object({
  customerAccountId: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  stage: customerLifecycleMarketingStageSchema,
  emailSubscriptionStatus: z.enum(["subscribed", "unsubscribed", "suppressed"]),
  nextCampaignKey: z.string().nullable(),
  automationFlags: z.array(z.string().min(1)),
  lastOrderAt: z.string().nullable(),
  lastWishlistActivityAt: z.string().nullable(),
})

export const storefrontLifecycleMarketingReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    totalCustomers: z.number().int().min(0),
    subscribedCount: z.number().int().min(0),
    winbackCount: z.number().int().min(0),
    vipJourneyCount: z.number().int().min(0),
    suppressedCount: z.number().int().min(0),
  }),
  items: z.array(storefrontLifecycleMarketingItemSchema),
})

export const storefrontCustomerAdminViewSchema = z.object({
  id: z.string().min(1),
  authUserId: z.string().nullable(),
  coreContactId: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().min(1),
  companyName: z.string().nullable(),
  gstin: z.string().nullable(),
  isActive: z.boolean(),
  lifecycleState: customerLifecycleStateSchema,
  lifecycleNote: z.string().nullable(),
  blockedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  anonymizedAt: z.string().nullable(),
  emailVerifiedAt: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  orderCount: z.number().int().min(0),
  supportCaseCount: z.number().int().min(0),
  requestCount: z.number().int().min(0),
  suspiciousLoginOpenCount: z.number().int().min(0),
  latestSuspiciousLoginAt: z.string().nullable(),
  suspiciousLoginReviewedAt: z.string().nullable(),
  suspiciousLoginReviewNote: z.string().nullable(),
  lastOrderAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
})

export const storefrontCustomerAdminReportSchema = z.object({
  generatedAt: z.string().min(1),
  summary: z.object({
    totalCustomers: z.number().int().min(0),
    activeCount: z.number().int().min(0),
    blockedCount: z.number().int().min(0),
    deletedCount: z.number().int().min(0),
    anonymizedCount: z.number().int().min(0),
    verifiedCount: z.number().int().min(0),
    suspiciousReviewCount: z.number().int().min(0),
  }),
  items: z.array(storefrontCustomerAdminViewSchema),
})

export const storefrontCustomerLifecycleActionSchema = z.enum([
  "activate",
  "block",
  "mark_deleted",
  "anonymize",
])

export const storefrontCustomerLifecycleActionPayloadSchema = z.object({
  customerAccountId: z.string().min(1),
  action: storefrontCustomerLifecycleActionSchema,
  note: z.string().trim().nullable().optional().default(null),
})

export const storefrontCustomerAdminResponseSchema = z.object({
  item: storefrontCustomerAdminViewSchema,
  suspiciousLoginEvents: z.array(storefrontCustomerSuspiciousLoginEventSchema),
})

export const storefrontCustomerSecurityReviewPayloadSchema = z.object({
  customerAccountId: z.string().min(1),
  note: z.string().trim().nullable().optional().default(null),
})

export const customerWishlistTogglePayloadSchema = z.object({
  productId: z.string().trim().min(1),
})

export const customerPortalPreferencesUpdatePayloadSchema =
  customerPortalPreferencesSchema.partial()

export const customerRegisterPayloadSchema = z.object({
  displayName: z.string().trim().min(2),
  email: z.email(),
  phoneNumber: z.string().trim().min(6),
  password: z.string().min(8),
  emailVerificationId: z.string().trim().min(1),
  companyName: z.string().trim().nullable().optional().default(null),
  gstin: z.string().trim().nullable().optional().default(null),
  addressLine1: z.string().trim().min(3),
  addressLine2: z.string().trim().nullable().optional().default(null),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  country: z.string().trim().min(2),
  pincode: z.string().trim().min(3),
})

export const customerLoginPayloadSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export const customerProfileUpdatePayloadSchema = z.object({
  displayName: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(6),
  companyName: z.string().trim().nullable().optional().default(null),
  legalName: z.string().trim().nullable().optional().default(null),
  gstin: z.string().trim().nullable().optional().default(null),
  website: z.string().trim().nullable().optional().default(null),
  addresses: z.array(contactAddressInputSchema).default([]),
  emails: z.array(contactEmailInputSchema).default([]),
  phones: z.array(contactPhoneInputSchema).default([]),
  bankAccounts: z.array(contactBankAccountInputSchema).default([]),
  gstDetails: z.array(contactGstDetailInputSchema).default([]),
})

export type CustomerAccount = z.infer<typeof customerAccountSchema>
export type CustomerProfile = z.infer<typeof customerProfileSchema>
export type CustomerProfileLookupResponse = z.infer<typeof customerProfileLookupResponseSchema>
export type CustomerPortalPreferences = z.infer<typeof customerPortalPreferencesSchema>
export type CustomerCommercialSegment = z.infer<typeof customerCommercialSegmentSchema>
export type CustomerCommercialProfile = z.infer<typeof customerCommercialProfileSchema>
export type CustomerLifecycleMarketingStage = z.infer<
  typeof customerLifecycleMarketingStageSchema
>
export type CustomerLifecycleMarketingState = z.infer<
  typeof customerLifecycleMarketingStateSchema
>
export type CustomerPortalCoupon = z.infer<typeof customerPortalCouponSchema>
export type CustomerPortalGiftCard = z.infer<typeof customerPortalGiftCardSchema>
export type CustomerRewardActivity = z.infer<typeof customerRewardActivitySchema>
export type CustomerRewards = z.infer<typeof customerRewardsSchema>
export type CustomerPortalRecord = z.infer<typeof customerPortalRecordSchema>
export type CustomerPortalStats = z.infer<typeof customerPortalStatsSchema>
export type CustomerPortalResponse = z.infer<typeof customerPortalResponseSchema>
export type StorefrontCustomerSegmentItem = z.infer<
  typeof storefrontCustomerSegmentItemSchema
>
export type StorefrontCustomerSegmentReport = z.infer<
  typeof storefrontCustomerSegmentReportSchema
>
export type StorefrontLifecycleMarketingItem = z.infer<
  typeof storefrontLifecycleMarketingItemSchema
>
export type StorefrontLifecycleMarketingReport = z.infer<
  typeof storefrontLifecycleMarketingReportSchema
>
export type CustomerLifecycleState = z.infer<typeof customerLifecycleStateSchema>
export type StorefrontCustomerSuspiciousLoginEvent = z.infer<
  typeof storefrontCustomerSuspiciousLoginEventSchema
>
export type StorefrontCustomerAdminView = z.infer<typeof storefrontCustomerAdminViewSchema>
export type StorefrontCustomerAdminReport = z.infer<typeof storefrontCustomerAdminReportSchema>
export type StorefrontCustomerLifecycleAction = z.infer<
  typeof storefrontCustomerLifecycleActionSchema
>
export type StorefrontCustomerLifecycleActionPayload = z.infer<
  typeof storefrontCustomerLifecycleActionPayloadSchema
>
export type StorefrontCustomerAdminResponse = z.infer<
  typeof storefrontCustomerAdminResponseSchema
>
export type StorefrontCustomerSecurityReviewPayload = z.infer<
  typeof storefrontCustomerSecurityReviewPayloadSchema
>
export type CustomerRegisterPayload = z.infer<typeof customerRegisterPayloadSchema>
export type CustomerLoginPayload = z.infer<typeof customerLoginPayloadSchema>
export type CustomerProfileUpdatePayload = z.infer<typeof customerProfileUpdatePayloadSchema>
export type CustomerWishlistTogglePayload = z.infer<typeof customerWishlistTogglePayloadSchema>
export type CustomerPortalPreferencesUpdatePayload = z.infer<
  typeof customerPortalPreferencesUpdatePayloadSchema
>
