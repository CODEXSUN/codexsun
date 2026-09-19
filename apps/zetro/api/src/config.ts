import { config } from "dotenv";
import { resolve } from "node:path";
import { readZetroApiRuntimeConfig } from "@codexsun/platform-core/runtime-config";

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const runtimeConfig = readZetroApiRuntimeConfig(process.env);
  assertLocalHost(runtimeConfig.PLATFORM_HOST);
  return runtimeConfig;
}

export function assertLocalHost(host: string): void {
  if (["127.0.0.1", "::1", "localhost"].includes(host.toLowerCase())) return;
  throw new Error("Zetro API must bind to a loopback PLATFORM_HOST because it controls the local Codex CLI.");
}
