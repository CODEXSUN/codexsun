import { LocalIdentityStore } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { createQcafeLifecyclePlans } from "./qcafe-lifecycle-plans.js";
import { createQcafePersistence } from "./modules/foundation/persistence/qcafe-persistence.js";

const configuration = readConfig();
const persistence = createQcafePersistence(configuration.persistence, createQcafeLifecyclePlans());

try {
  const executed = await persistence.initialize();
  const records = await persistence.verify();
  console.log(executed.length ? `Applied: ${executed.join(", ")}` : "Database migrations are current.");
  console.log(`Verified ${records.length} Q Cafe lifecycle records.`);
} finally {
  await persistence.destroy();
}

const identity = new LocalIdentityStore({
  ...configuration,
  appMode: "development",
  refreshSeeds: false,
});

try {
  await identity.initialize();
  console.log("Prepared the Q Cafe identity schema and required accounts.");
} finally {
  identity.close();
}
