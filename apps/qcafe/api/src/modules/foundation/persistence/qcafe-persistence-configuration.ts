import { z } from "zod";
import { readDatabaseConnectionUrl } from "@codexsun/platform-core";
import type { QcafePersistenceConfiguration } from "./qcafe-persistence.js";

const driverSchema = z.enum(["mariadb", "sqlite"]);
const urlSchema = z.string().url();

export function readQcafePersistenceConfiguration(
  environment: NodeJS.ProcessEnv,
  localDatabasePath: string,
): QcafePersistenceConfiguration {
  const driver = driverSchema.parse(environment.DB_DRIVER ?? "sqlite");
  const syncCloudUrl = optionalUrl(environment.QCAFE_SYNC_CLOUD_URL);
  if (driver === "sqlite") return withSyncCloudUrl({ localDatabasePath, mode: "local" }, syncCloudUrl);

  const cloudDatabaseUrl = readDatabaseConnectionUrl(environment);
  return withSyncCloudUrl({ cloudDatabaseUrl, localDatabasePath, mode: "cloud" }, syncCloudUrl);
}

function optionalUrl(value: string | undefined): string | undefined {
  return value ? urlSchema.parse(value) : undefined;
}

function withSyncCloudUrl(
  configuration: Omit<QcafePersistenceConfiguration, "syncCloudUrl">,
  syncCloudUrl: string | undefined,
): QcafePersistenceConfiguration {
  return syncCloudUrl ? { ...configuration, syncCloudUrl } : configuration;
}
