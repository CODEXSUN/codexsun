import { config } from "dotenv";
import { resolve } from "node:path";
import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { readQcafePersistenceConfiguration } from "./modules/foundation/persistence/qcafe-persistence-configuration.js";
import type { QcafePersistenceConfiguration } from "./modules/foundation/persistence/qcafe-persistence.js";

type QcafeConfiguration = ReturnType<typeof readLocalIdentityConfiguration> & {
  readonly apiReferenceToken: string;
  readonly host: string;
  readonly persistence: QcafePersistenceConfiguration;
  readonly port: number;
  readonly storageRoot: string;
};

export function readConfig(): QcafeConfiguration {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.QCAFE_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set QCAFE_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.QCAFE_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set QCAFE_API_REFERENCE_TOKEN.");
  const storageRoot = resolveApplicationPath(process.env.QCAFE_STORAGE_ROOT, "QCAFE_STORAGE_ROOT");
  const localDatabasePath = resolveApplicationPath(process.env.QCAFE_SQLITE_PATH, "QCAFE_SQLITE_PATH");
  const identityDatabasePath = resolveApplicationPath(
    process.env.QCAFE_IDENTITY_DATABASE_PATH,
    "QCAFE_IDENTITY_DATABASE_PATH",
  );
  return {
    apiReferenceToken,
    host,
    port,
    persistence: readQcafePersistenceConfiguration(process.env, localDatabasePath),
    storageRoot,
    ...readLocalIdentityConfiguration(process.env, {
      applicationId: "qcafe",
      databasePath: identityDatabasePath,
    }),
  };
}

function resolveApplicationPath(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`Set ${name}.`);
  return resolve(process.cwd(), value);
}
