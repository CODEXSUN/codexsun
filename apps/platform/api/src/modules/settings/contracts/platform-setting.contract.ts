import { z } from "zod";

export const platformSettingSchema = z.object({
  key: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(500),
});

export type PlatformSetting = z.infer<typeof platformSettingSchema>;
