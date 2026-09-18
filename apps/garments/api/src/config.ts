import { config } from "dotenv";
import { resolve } from "node:path";
import { readGarmentsApiRuntimeConfig } from "@codexsun/platform-core/runtime-config";

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  return readGarmentsApiRuntimeConfig(process.env);
}
