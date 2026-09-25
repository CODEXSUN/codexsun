import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { config } from "dotenv";
import { resolve } from "node:path";

type EcommerceConfiguration = ReturnType<typeof readLocalIdentityConfiguration> & { readonly apiReferenceToken: string; readonly host: string; readonly port: number };

export function readConfig(): EcommerceConfiguration {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.ECOMMERCE_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set ECOMMERCE_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.ECOMMERCE_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set ECOMMERCE_API_REFERENCE_TOKEN.");
  return { apiReferenceToken, host, port, ...readLocalIdentityConfiguration(process.env, { applicationId: "ecommerce", databasePath: resolve(process.cwd(), "../../../storage/apps/ecommerce/private/data/ecommerce_db.sqlite") }) };
}
