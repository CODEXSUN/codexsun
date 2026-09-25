import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { config } from "dotenv";
import { resolve } from "node:path";

type BillingConfiguration = ReturnType<typeof readLocalIdentityConfiguration> & { readonly apiReferenceToken: string; readonly host: string; readonly port: number };

export function readConfig(): BillingConfiguration {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.BILLING_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set BILLING_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.BILLING_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set BILLING_API_REFERENCE_TOKEN.");
  return { apiReferenceToken, host, port, ...readLocalIdentityConfiguration(process.env, { applicationId: "billing", databasePath: resolve(process.cwd(), "../../../storage/apps/billing/private/data/billing_db.sqlite") }) };
}
