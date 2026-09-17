import { config } from "dotenv";
import { resolve } from "node:path";
import { readZetroApiRuntimeConfig } from "@codexsun/platform-core/runtime-config";

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  return readZetroApiRuntimeConfig(process.env);
}
