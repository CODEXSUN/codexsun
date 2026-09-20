import { config } from "dotenv";
import { resolve } from "node:path";
import { readLocalIdentityConfiguration } from "@codexsun/platform-core";

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.ORSHIP_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set ORSHIP_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.ORSHIP_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set ORSHIP_API_REFERENCE_TOKEN.");
  const webOrigin = process.env.ORSHIP_WEB_ORIGIN;
  if (!webOrigin) throw new Error("Set ORSHIP_WEB_ORIGIN.");
  return {
    apiReferenceToken,
    host,
    port,
    webOrigin,
    ...readLocalIdentityConfiguration(process.env, {
      applicationId: "orship",
      databasePath: resolve(process.cwd(), "../../../storage/apps/orship/private/data/orship_db.sqlite"),
    }),
  };
}
