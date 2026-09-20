import { config } from "dotenv";
import { resolve } from "node:path";
import { readDatabaseConnectionUrl, readLocalIdentityConfiguration } from "@codexsun/platform-core";

type OrshipConfiguration = ReturnType<typeof readLocalIdentityConfiguration> & { readonly apiReferenceToken: string; readonly databaseUrl: string; readonly dockerManagerToken: string; readonly dockerManagerUrl: string; readonly host: string; readonly mariadbContainerName: string; readonly mariadbDatabase: string; readonly mariadbHostPort: number; readonly mariadbImage: string; readonly mariadbNetwork: string; readonly port: number; readonly webOrigin: string };

export function readConfig(): OrshipConfiguration {
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
  const dockerManagerUrl = process.env.ORSHIP_DOCKER_MANAGER_URL ?? "http://127.0.0.1:6302";
  const dockerManagerToken = process.env.ORSHIP_DOCKER_TOKEN ?? "orship-local-docker-token";
  const mariadbHostPort = Number(process.env.ORSHIP_MARIADB_HOST_PORT ?? "3309");
  if (!Number.isInteger(mariadbHostPort) || mariadbHostPort < 1 || mariadbHostPort > 65_535) throw new Error("Set ORSHIP_MARIADB_HOST_PORT to a valid port.");
  return {
    apiReferenceToken,
    databaseUrl: readDatabaseConnectionUrl(process.env),
    dockerManagerToken,
    dockerManagerUrl,
    host,
    mariadbContainerName: process.env.ORSHIP_MARIADB_CONTAINER_NAME ?? "orship-database",
    mariadbDatabase: process.env.ORSHIP_MARIADB_DATABASE ?? "orship_db",
    mariadbHostPort,
    mariadbImage: process.env.ORSHIP_MARIADB_IMAGE ?? "orship/mariadb:11.8",
    mariadbNetwork: process.env.ORSHIP_MARIADB_NETWORK ?? "codexsun-network",
    port,
    webOrigin,
    ...readLocalIdentityConfiguration(process.env, {
      applicationId: "orship",
      databasePath: resolve(process.cwd(), "../../../storage/apps/orship/private/data/orship_db.sqlite"),
    }),
  };
}
