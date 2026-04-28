import { z } from "zod"

export const tenantVisibilityCurrentSchema = z.object({
  tenantId: z.string().min(1).nullable(),
  companyId: z.string().min(1).nullable(),
  industryId: z.string().min(1).nullable(),
  clientOverlayId: z.string().min(1).nullable(),
  visibleAppIds: z.array(z.string().min(1)),
  visibleModuleIds: z.array(z.string().min(1)),
})

export const tenantVisibilityBundleSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  summary: z.string().min(1),
  enabledAppIds: z.array(z.string().min(1)),
  enabledModuleIds: z.array(z.string().min(1)),
  featureFlags: z.array(z.string().min(1)),
})

export const tenantVisibilityClientOverlaySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  summary: z.string().min(1),
  industryId: z.string().min(1).nullable(),
  enabledAppIds: z.array(z.string().min(1)),
  disabledAppIds: z.array(z.string().min(1)),
  enabledModuleIds: z.array(z.string().min(1)),
  disabledModuleIds: z.array(z.string().min(1)),
  featureFlags: z.array(z.string().min(1)),
})

export const tenantVisibilityModuleCatalogSchema = z.object({
  id: z.string().min(1),
  menuGroupId: z.string().min(1),
  label: z.string().min(1),
  route: z.string().min(1),
  summary: z.string().min(1),
})

export const tenantVisibilityAppCatalogSchema = z.object({
  appId: z.string().min(1),
  label: z.string().min(1),
  route: z.string().min(1),
  summary: z.string().min(1),
  modules: z.array(tenantVisibilityModuleCatalogSchema),
})

export const tenantVisibilityTenantItemSchema = z.object({
  tenantId: z.string().min(1),
  tenantSlug: z.string().min(1),
  tenantDisplayName: z.string().min(1),
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  isPrimaryCompany: z.boolean(),
  isActiveCompany: z.boolean(),
  industryId: z.string().min(1),
  clientOverlayId: z.string().min(1).nullable(),
  enabledAppIds: z.array(z.string().min(1)),
  enabledModuleIds: z.array(z.string().min(1)),
  featureFlags: z.array(z.string().min(1)),
  inventoryMode: z.enum(["basic", "warehouse", "warehouse-bin", "warehouse-bin-batch-serial"]),
  productionPolicy: z.enum(["single-company", "multi-company"]),
})

export const tenantVisibilityAdminSnapshotSchema = z.object({
  bundles: z.array(tenantVisibilityBundleSchema),
  clientOverlays: z.array(tenantVisibilityClientOverlaySchema),
  apps: z.array(tenantVisibilityAppCatalogSchema),
  items: z.array(tenantVisibilityTenantItemSchema),
  current: tenantVisibilityCurrentSchema,
})

export const tenantVisibilityAdminSnapshotResponseSchema = z.object({
  item: tenantVisibilityAdminSnapshotSchema,
})

export const tenantVisibilityProfileUpdatePayloadSchema = z.object({
  companyId: z.string().min(1),
  industryId: z.string().min(1),
  clientOverlayId: z.string().min(1).nullable(),
  enabledAppIds: z.array(z.string().min(1)),
  enabledModuleIds: z.array(z.string().min(1)),
  featureFlags: z.array(z.string().min(1)).default([]),
  inventoryMode: z.enum(["basic", "warehouse", "warehouse-bin", "warehouse-bin-batch-serial"]),
  productionPolicy: z.enum(["single-company", "multi-company"]),
})

export const tenantVisibilityProfileUpdateResponseSchema = z.object({
  item: tenantVisibilityTenantItemSchema,
})

export type TenantVisibilityCurrent = z.infer<typeof tenantVisibilityCurrentSchema>
export type TenantVisibilityBundle = z.infer<typeof tenantVisibilityBundleSchema>
export type TenantVisibilityClientOverlay = z.infer<typeof tenantVisibilityClientOverlaySchema>
export type TenantVisibilityAppCatalog = z.infer<typeof tenantVisibilityAppCatalogSchema>
export type TenantVisibilityTenantItem = z.infer<typeof tenantVisibilityTenantItemSchema>
export type TenantVisibilityAdminSnapshot = z.infer<typeof tenantVisibilityAdminSnapshotSchema>
export type TenantVisibilityAdminSnapshotResponse = z.infer<typeof tenantVisibilityAdminSnapshotResponseSchema>
export type TenantVisibilityProfileUpdatePayload = z.infer<typeof tenantVisibilityProfileUpdatePayloadSchema>
export type TenantVisibilityProfileUpdateResponse = z.infer<typeof tenantVisibilityProfileUpdateResponseSchema>
