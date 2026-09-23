import { LocalIdentityStore } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { createCrmPersistence } from "./modules/foundation/persistence/crm-persistence.js";

const configuration = readConfig();
const identity = new LocalIdentityStore({ ...configuration, appMode: "development", refreshSeeds: false });
const persistence = createCrmPersistence({ localDatabasePath: configuration.databasePath });

try {
  await identity.initialize();
  await persistence.initialize();
  console.log("Prepared the CRM identity schema, accounts, and CRM data schema.");
} finally {
  identity.close();
  await persistence.destroy();
}
