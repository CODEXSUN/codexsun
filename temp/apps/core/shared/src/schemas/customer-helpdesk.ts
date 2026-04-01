import { z } from 'zod'
import { customerDeliveryAddressSchema, customerProfileSchema } from './customer-profile'
import { storefrontOrderSchema } from './storefront'

export const customerHelpdeskIssueSeveritySchema = z.enum(['info', 'warning', 'critical'])

export const customerHelpdeskIssueSchema = z.object({
  code: z.string().min(1),
  severity: customerHelpdeskIssueSeveritySchema,
  title: z.string().min(1),
  description: z.string().min(1),
})

export const customerHelpdeskVerificationSchema = z.object({
  id: z.string().min(1),
  purpose: z.string().min(1),
  channel: z.enum(['email', 'mobile']),
  destination: z.string().min(1),
  expiresAt: z.string().min(1),
  verifiedAt: z.string().nullable(),
  consumedAt: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
})

export const customerHelpdeskSummarySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email(),
  phoneNumber: z.string().nullable(),
  isActive: z.boolean(),
  deletionRequestedAt: z.string().nullable(),
  purgeAfterAt: z.string().nullable(),
  orderCount: z.number().int().nonnegative(),
  totalSpent: z.number().nonnegative(),
  lastOrderAt: z.string().nullable(),
  lastOrderNumber: z.string().nullable(),
  lastOrderStatus: z.string().nullable(),
  defaultAddressSummary: z.string().nullable(),
  issueCount: z.number().int().nonnegative(),
})

export const customerHelpdeskListResponseSchema = z.object({
  items: z.array(customerHelpdeskSummarySchema),
})

export const customerHelpdeskDetailSchema = z.object({
  customer: customerHelpdeskSummarySchema.extend({
    profile: customerProfileSchema,
  }),
  orders: z.array(storefrontOrderSchema),
  addresses: z.array(customerDeliveryAddressSchema),
  verifications: z.array(customerHelpdeskVerificationSchema),
  issues: z.array(customerHelpdeskIssueSchema),
})

export const customerHelpdeskDetailResponseSchema = z.object({
  item: customerHelpdeskDetailSchema,
})

export type CustomerHelpdeskIssueSeverity = z.infer<typeof customerHelpdeskIssueSeveritySchema>
export type CustomerHelpdeskIssue = z.infer<typeof customerHelpdeskIssueSchema>
export type CustomerHelpdeskVerification = z.infer<typeof customerHelpdeskVerificationSchema>
export type CustomerHelpdeskSummary = z.infer<typeof customerHelpdeskSummarySchema>
export type CustomerHelpdeskListResponse = z.infer<typeof customerHelpdeskListResponseSchema>
export type CustomerHelpdeskDetail = z.infer<typeof customerHelpdeskDetailSchema>
export type CustomerHelpdeskDetailResponse = z.infer<typeof customerHelpdeskDetailResponseSchema>
