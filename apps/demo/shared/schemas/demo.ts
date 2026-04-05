import { z } from "zod"

export const demoProfileIdSchema = z.enum(["default", "demo"])

export const demoProfileSchema = z.object({
  id: demoProfileIdSchema,
  name: z.string().min(1),
  summary: z.string().min(1),
})

export const demoModuleMetricSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  currentCount: z.number().int().nonnegative(),
  defaultCount: z.number().int().nonnegative(),
  demoCount: z.number().int().nonnegative(),
})

export const demoModuleSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  currentCount: z.number().int().nonnegative(),
  defaultCount: z.number().int().nonnegative(),
  demoCount: z.number().int().nonnegative(),
  supportsDemo: z.boolean(),
  items: z.array(demoModuleMetricSchema).default([]),
})

export const demoSummaryResponseSchema = z.object({
  generatedAt: z.string().min(1),
  profiles: z.array(demoProfileSchema),
  modules: z.array(demoModuleSummarySchema),
})

export const demoInstallPayloadSchema = z.object({
  profileId: demoProfileIdSchema,
})

export const demoInstallResponseSchema = z.object({
  installedAt: z.string().min(1),
  profile: demoProfileSchema,
  summary: demoSummaryResponseSchema,
})

export const demoInstallTargetSchema = z.enum([
  "profile",
  "contacts",
  "customers",
  "products",
  "categories",
])

export const demoInstallVariantSchema = z.enum([
  "default",
  "demo",
  "customer",
  "supplier",
  "portal",
  "catalog",
  "storefront",
])

export const demoInstallJobPayloadSchema = z.object({
  target: demoInstallTargetSchema,
  variant: demoInstallVariantSchema,
  count: z.number().int().min(1).max(200).optional().default(1),
})

export const demoInstallJobSchema = z.object({
  id: z.string().min(1),
  target: demoInstallTargetSchema,
  variant: demoInstallVariantSchema,
  count: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  processed: z.number().int().nonnegative(),
  percent: z.number().min(0).max(100),
  status: z.enum(["queued", "running", "completed", "failed"]),
  message: z.string().min(1),
  startedAt: z.string().min(1),
  finishedAt: z.string().nullable(),
  summary: demoSummaryResponseSchema.nullable().default(null),
})

export const demoInstallJobResponseSchema = z.object({
  item: demoInstallJobSchema,
})

export type DemoProfileId = z.infer<typeof demoProfileIdSchema>
export type DemoProfile = z.infer<typeof demoProfileSchema>
export type DemoModuleMetric = z.infer<typeof demoModuleMetricSchema>
export type DemoModuleSummary = z.infer<typeof demoModuleSummarySchema>
export type DemoSummaryResponse = z.infer<typeof demoSummaryResponseSchema>
export type DemoInstallPayload = z.infer<typeof demoInstallPayloadSchema>
export type DemoInstallResponse = z.infer<typeof demoInstallResponseSchema>
export type DemoInstallTarget = z.infer<typeof demoInstallTargetSchema>
export type DemoInstallVariant = z.infer<typeof demoInstallVariantSchema>
export type DemoInstallJobPayload = z.infer<typeof demoInstallJobPayloadSchema>
export type DemoInstallJob = z.infer<typeof demoInstallJobSchema>
export type DemoInstallJobResponse = z.infer<typeof demoInstallJobResponseSchema>
