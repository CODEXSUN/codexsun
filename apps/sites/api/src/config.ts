import { config } from "dotenv";
import { resolve } from "node:path";
import { readLocalIdentityConfiguration } from "@codexsun/platform-core";

type SitesConfiguration = ReturnType<typeof readLocalIdentityConfiguration> & {
  readonly apiReferenceToken: string;
  readonly clientSlug?: string;
  readonly deploymentProvider: "record-only" | "docker";
  readonly host: string;
  readonly port: number;
};

export function readConfig(): SitesConfiguration {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.SITES_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set SITES_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.SITES_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set SITES_API_REFERENCE_TOKEN.");
  const clientSlug = process.env.SITES_CLIENT_SLUG?.trim().toLowerCase();
  if (clientSlug && !/^[a-z0-9-]+$/u.test(clientSlug)) throw new Error("Set SITES_CLIENT_SLUG to a lowercase slug.");
  const deploymentProvider = process.env.SITES_DEPLOYMENT_PROVIDER?.trim() || "record-only";
  if (deploymentProvider !== "record-only" && deploymentProvider !== "docker")
    throw new Error("Set SITES_DEPLOYMENT_PROVIDER to record-only or docker.");
  return {
    apiReferenceToken,
    clientSlug,
    deploymentProvider,
    host,
    port,
    ...readLocalIdentityConfiguration(process.env, {
      applicationId: "sites",
      databasePath:
        process.env.SITES_DATABASE_PATH?.trim() ||
        resolve(process.cwd(), "../../../storage/apps/sites/private/data/sites_db.sqlite"),
    }),
  };
}
