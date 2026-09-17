import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

const runtimeConfigSchema = z.object({
  ORSHIP_HOST: z.string().trim().min(1),
  ORSHIP_API_PORT: z.coerce.number().int().min(1).max(65535),
  ORSHIP_WEB_ORIGIN: z.string().url(),
  ORSHIP_STORAGE_ROOT: z.string().trim().min(1),
});

export type OrshipApiConfig = z.infer<typeof runtimeConfigSchema>;

export function readConfig(environment = process.env): OrshipApiConfig {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const parsed = runtimeConfigSchema.parse(environment);
  return { ...parsed, ORSHIP_STORAGE_ROOT: resolve(process.cwd(), parsed.ORSHIP_STORAGE_ROOT) };
}
