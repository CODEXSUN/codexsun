import { config } from "dotenv";
import { resolve } from "node:path";
import { readLocalIdentityConfiguration } from "@codexsun/platform-core";
import { readQcafePersistenceConfiguration } from "./modules/foundation/persistence/qcafe-persistence-configuration.js";

export function readConfig() {
  config({ path: resolve(process.cwd(), "../../../.env") });
  config({ path: resolve(process.cwd(), ".app.env"), override: true });
  const port = Number(process.env.QCAFE_API_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set QCAFE_API_PORT to a valid port.");
  const host = process.env.PLATFORM_HOST;
  if (!host) throw new Error("Set PLATFORM_HOST.");
  const apiReferenceToken = process.env.QCAFE_API_REFERENCE_TOKEN;
  if (!apiReferenceToken) throw new Error("Set QCAFE_API_REFERENCE_TOKEN.");
  const localDatabasePath = resolve(process.cwd(), "../../../storage/apps/qcafe/private/data/qcafe.sqlite");
  return {
    apiReferenceToken,
    host,
    port,
    persistence: readQcafePersistenceConfiguration(process.env, localDatabasePath),
    ...readLocalIdentityConfiguration(process.env, {
      applicationId: "qcafe",
      databasePath: resolve(process.cwd(), "../../../storage/apps/qcafe/private/data/qcafe_db.sqlite"),
    }),
  };
}
