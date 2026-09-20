import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { config } from "dotenv";
import { resolve } from "node:path";

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
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
  return { apiReferenceToken, cxforgeClientKey, cxforgeUrl, host, port, ...readLocalIdentityConfiguration(process.env, { applicationId: "zuno", databasePath: resolve(process.cwd(), "../../../storage/apps/zuno/private/data/zuno_db.sqlite") }) };
}

function readUrl(value: string | undefined, key: string): string {
  try {
    return new URL(value ?? "").origin;
  } catch {
    throw new Error(`Set ${key} to a valid URL.`);
  }
}
