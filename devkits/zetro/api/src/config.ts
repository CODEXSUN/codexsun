import { config } from "dotenv";
import { resolve } from "node:path";
import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { readZetroApiRuntimeConfig } from "@codexsun/platform-core/runtime-config";

type ZetroConfiguration = ReturnType<typeof readZetroApiRuntimeConfig> & ReturnType<typeof readLocalIdentityConfiguration> & { readonly zunoApiUrl: string; readonly zunoClientKey: string };

export function readConfig(): ZetroConfiguration {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const runtimeConfig = readZetroApiRuntimeConfig(process.env);
  assertLocalHost(runtimeConfig.PLATFORM_HOST, process.env.ZETRO_CONTAINER_RUNTIME === "1");
  const zunoApiUrl = readServiceUrl(process.env.ZETRO_ZUNO_API_URL);
  const zunoClientKey = readServiceKey(process.env.ZETRO_ZUNO_CLIENT_KEY);
  return {
    ...runtimeConfig,
    zunoApiUrl,
    zunoClientKey,
    ...readLocalIdentityConfiguration(process.env, {
      applicationId: "zetro",
      databasePath: runtimeConfig.ZETRO_DATABASE_PATH,
    }),
  };
}

function readServiceUrl(value: string | undefined): string {
  try {
    return new URL(value?.trim() || "http://127.0.0.1:6410").origin;
  } catch {
    throw new Error("Set ZETRO_ZUNO_API_URL to a valid URL.");
  }
}

function readServiceKey(value: string | undefined): string {
  const resolved = value?.trim() || (process.env.APP_MODE === "production" ? "" : "development-zetro-zuno-client-key");
  if (resolved.length < 32) throw new Error("Set ZETRO_ZUNO_CLIENT_KEY to a value with at least 32 characters.");
  return resolved;
}

export function assertLocalHost(host: string, containerRuntime = false): void {
  if (containerRuntime && host === "0.0.0.0") return;
  if (["127.0.0.1", "::1", "localhost"].includes(host.toLowerCase())) return;
  throw new Error("Zetro API must bind to a loopback PLATFORM_HOST unless ZETRO_CONTAINER_RUNTIME=1 because it controls the local Codex CLI.");
}
