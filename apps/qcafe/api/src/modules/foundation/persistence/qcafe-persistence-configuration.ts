import { z } from "zod";
import type { QcafePersistenceConfiguration } from "./qcafe-persistence.js";

const modeSchema = z.enum(["cloud", "local"]);
const urlSchema = z.string().url();

export function readQcafePersistenceConfiguration(
  environment: NodeJS.ProcessEnv,
  localDatabasePath: string,
): QcafePersistenceConfiguration {
  const mode = modeSchema.parse(environment.QCAFE_DATA_MODE ?? "local");
  const syncCloudUrl = optionalUrl(environment.QCAFE_SYNC_CLOUD_URL);
  if (mode === "local") return withSyncCloudUrl({ localDatabasePath, mode }, syncCloudUrl);

  const cloudDatabaseUrl = requiredUrl(
    environment.QCAFE_CLOUD_DATABASE_URL,
    "Set QCAFE_CLOUD_DATABASE_URL for cloud mode.",
  );
  if (new URL(cloudDatabaseUrl).protocol !== "mysql:") throw new Error("QCAFE_CLOUD_DATABASE_URL must use mysql://.");
  return withSyncCloudUrl({ cloudDatabaseUrl, localDatabasePath, mode }, syncCloudUrl);
}

function optionalUrl(value: string | undefined): string | undefined {
  return value ? urlSchema.parse(value) : undefined;
}

function requiredUrl(value: string | undefined, message: string): string {
  if (!value) throw new Error(message);
  return urlSchema.parse(value);
}

function withSyncCloudUrl(
  configuration: Omit<QcafePersistenceConfiguration, "syncCloudUrl">,
  syncCloudUrl: string | undefined,
): QcafePersistenceConfiguration {
  return syncCloudUrl ? { ...configuration, syncCloudUrl } : configuration;
}
