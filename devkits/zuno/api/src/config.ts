import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { config } from "dotenv";
import { resolve } from "node:path";

type ZunoConfig = ReturnType<typeof readLocalIdentityConfiguration> & {
  readonly agentDatabasePath: string;
  readonly agentLeaseKey: string;
  readonly agentBootstrapKey: string;
  readonly zxaControlKey: string;
  readonly apiReferenceToken: string;
  readonly cxforgeClientKey: string;
  readonly cxforgeUrl: string;
  readonly dataRoot: string;
  readonly handoffDatabasePath: string;
  readonly host: string;
  readonly codeServerUrl?: string;
  readonly port: number;
  readonly repositoryRoot: string;
  readonly zetroClientKey: string;
};

export function readConfig(): ZunoConfig {
  const repositoryRoot = resolve(process.env.ZUNO_REPOSITORY_ROOT?.trim() || resolve(process.cwd(), "../../.."));
  const dataRoot = resolve(process.env.ZUNO_DATA_ROOT?.trim() || resolve(repositoryRoot, "storage/devkits/zuno/private/data"));
  config({ path: resolve(repositoryRoot, ".env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.ZUNO_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set ZUNO_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.ZUNO_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set ZUNO_API_REFERENCE_TOKEN.");
  const cxforgeUrl = readUrl(process.env.ZUNO_CXFORGE_API_URL, "ZUNO_CXFORGE_API_URL");
  const cxforgeClientKey = process.env.ZUNO_CXFORGE_CLIENT_KEY;
  if (!cxforgeClientKey || cxforgeClientKey.length < 32) throw new Error("Set ZUNO_CXFORGE_CLIENT_KEY to a value with at least 32 characters.");
  const zetroClientKey = readServiceKey(process.env.ZUNO_ZETRO_CLIENT_KEY, "ZUNO_ZETRO_CLIENT_KEY", "development-zetro-zuno-client-key");
  const agentLeaseKey = readServiceKey(process.env.ZUNO_AGENT_LEASE_KEY, "ZUNO_AGENT_LEASE_KEY");
  const agentBootstrapKey = readServiceKey(process.env.ZUNO_ZXA_BOOTSTRAP_KEY, "ZUNO_ZXA_BOOTSTRAP_KEY");
  const zxaControlKey = readServiceKey(process.env.ZUNO_ZXA_CONTROL_KEY, "ZUNO_ZXA_CONTROL_KEY");
  const codeServerUrl = process.env.ZUNO_CODE_SERVER_URL?.trim() ? readUrl(process.env.ZUNO_CODE_SERVER_URL, "ZUNO_CODE_SERVER_URL") : undefined;
  return { agentBootstrapKey, agentDatabasePath: resolve(dataRoot, "zuno_agents.sqlite"), agentLeaseKey, apiReferenceToken, codeServerUrl, cxforgeClientKey, cxforgeUrl, dataRoot, handoffDatabasePath: resolve(dataRoot, "zuno_handoffs.sqlite"), host, port, repositoryRoot, zetroClientKey, zxaControlKey, ...readLocalIdentityConfiguration(process.env, { applicationId: "zuno", databasePath: resolve(dataRoot, "zuno_db.sqlite") }) };
}

function readUrl(value: string | undefined, key: string): string {
  try {
    return new URL(value ?? "").origin;
  } catch {
    throw new Error(`Set ${key} to a valid URL.`);
  }
}

function readServiceKey(value: string | undefined, key: string, developmentFallback?: string): string {
  const resolved = value?.trim() || (process.env.APP_MODE === "production" ? "" : developmentFallback ?? `development-${key.toLowerCase()}-key`);
  if (resolved.length < 32) throw new Error(`Set ${key} to a value with at least 32 characters.`);
  return resolved;
}
