import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { config } from "dotenv";
import { resolve } from "node:path";

type ZunoConfig = ReturnType<typeof readLocalIdentityConfiguration> & {
  readonly apiReferenceToken: string;
  readonly cxforgeClientKey: string;
  readonly cxforgeUrl: string;
  readonly dataRoot: string;
  readonly handoffDatabasePath: string;
  readonly host: string;
  readonly port: number;
  readonly repositoryRoot: string;
  readonly zetroClientKey: string;
};

export function readConfig(): ZunoConfig {
  const repositoryRoot = resolve(process.env.ZUNO_REPOSITORY_ROOT?.trim() || resolve(process.cwd(), "../../.."));
  const dataRoot = resolve(process.env.ZUNO_DATA_ROOT?.trim() || resolve(repositoryRoot, "storage/apps/devkits/zuno/private/data"));
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
  const zetroClientKey = readServiceKey(process.env.ZUNO_ZETRO_CLIENT_KEY, "ZUNO_ZETRO_CLIENT_KEY");
  return { apiReferenceToken, cxforgeClientKey, cxforgeUrl, dataRoot, handoffDatabasePath: resolve(dataRoot, "zuno_handoffs.sqlite"), host, port, repositoryRoot, zetroClientKey, ...readLocalIdentityConfiguration(process.env, { applicationId: "zuno", databasePath: resolve(dataRoot, "zuno_db.sqlite") }) };
}

function readUrl(value: string | undefined, key: string): string {
  try {
    return new URL(value ?? "").origin;
  } catch {
    throw new Error(`Set ${key} to a valid URL.`);
  }
}

function readServiceKey(value: string | undefined, key: string): string {
  const resolved = value?.trim() || (process.env.APP_MODE === "production" ? "" : "development-zetro-zuno-client-key");
  if (resolved.length < 32) throw new Error(`Set ${key} to a value with at least 32 characters.`);
  return resolved;
}
