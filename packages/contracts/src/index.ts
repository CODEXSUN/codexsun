import { z } from "zod";

export const apiErrorSchema = z.object({ error: z.string().min(1), code: z.string().min(1) });
export const platformHealthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  providers: z.array(z.string()),
  readiness: z.array(z.object({ id: z.string(), state: z.string() })),
});
export const platformModulesSchema = z.object({ providers: z.array(z.string()) });
export const platformSettingSchema = z.object({ key: z.string(), value: z.string() });
export const platformSettingsSchema = z.object({ settings: z.array(platformSettingSchema) });

export type ApiError = z.infer<typeof apiErrorSchema>;
export type PlatformHealth = z.infer<typeof platformHealthSchema>;
export type PlatformModules = z.infer<typeof platformModulesSchema>;
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export function apiError(error: string, code: string): ApiError {
  return apiErrorSchema.parse({ error, code });
}
