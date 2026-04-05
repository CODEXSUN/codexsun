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

export const toastPositionSchema = z.enum([
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
])

export const toastToneSchema = z.enum(["soft", "solid"])

export const toastSettingsSchema = z.object({
  position: toastPositionSchema,
  tone: toastToneSchema,
})

export const uiFeedbackSettingsSchema = z.object({
  toast: toastSettingsSchema,
})

export const appSettingsSnapshotSchema = z.object({
  authMetadata: authMetadataSettingsSchema,
  uiFeedback: uiFeedbackSettingsSchema,
  loadedAt: z.string().min(1),
})

export const appSettingsResponseSchema = z.object({
  item: appSettingsSnapshotSchema,
})

export type AppSettingOption = z.infer<typeof appSettingOptionSchema>
export type AuthMetadataSettings = z.infer<typeof authMetadataSettingsSchema>
export type ToastPosition = z.infer<typeof toastPositionSchema>
export type ToastTone = z.infer<typeof toastToneSchema>
export type ToastSettings = z.infer<typeof toastSettingsSchema>
export type UiFeedbackSettings = z.infer<typeof uiFeedbackSettingsSchema>
export type AppSettingsSnapshot = z.infer<typeof appSettingsSnapshotSchema>
export type AppSettingsResponse = z.infer<typeof appSettingsResponseSchema>
