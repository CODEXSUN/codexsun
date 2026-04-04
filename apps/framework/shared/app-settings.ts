import { z } from "zod"

export const appSettingOptionSchema = z.object({
  appId: z.string().min(1).nullable(),
  category: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  route: z.string().min(1).nullable(),
  scopeType: z.string().min(1).nullable(),
  summary: z.string().min(1).nullable(),
})

export const authMetadataSettingsSchema = z.object({
  actorTypes: z.array(appSettingOptionSchema),
  apps: z.array(appSettingOptionSchema),
  permissionActionTypes: z.array(appSettingOptionSchema),
  permissionScopeTypes: z.array(appSettingOptionSchema),
  resources: z.array(appSettingOptionSchema),
})

export const appSettingsSnapshotSchema = z.object({
  authMetadata: authMetadataSettingsSchema,
  loadedAt: z.string().min(1),
})

export const appSettingsResponseSchema = z.object({
  item: appSettingsSnapshotSchema,
})

export type AppSettingOption = z.infer<typeof appSettingOptionSchema>
export type AuthMetadataSettings = z.infer<typeof authMetadataSettingsSchema>
export type AppSettingsSnapshot = z.infer<typeof appSettingsSnapshotSchema>
export type AppSettingsResponse = z.infer<typeof appSettingsResponseSchema>
