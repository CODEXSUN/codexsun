import { config } from "dotenv";
import { resolve } from "node:path";

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.LMS_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set LMS_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.LMS_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set LMS_API_REFERENCE_TOKEN.");
  return { apiReferenceToken, host, port };
}
