import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

const schema = z.object({
  PLATFORM_API_PORT: z.coerce.number().int().min(1).max(65_535),
  PLATFORM_HOST: z.string().min(1),
});

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  return schema.parse(process.env);
}
