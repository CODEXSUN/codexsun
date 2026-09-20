import { ensureConfiguredMariaDbDatabase } from "./modules/foundation/persistence/qcafe-database-verifier.js";
import { createQcafePersistence } from "./modules/foundation/persistence/qcafe-persistence.js";
import { readConfig } from "./config.js";
import { createQcafeLifecyclePlans } from "./qcafe-lifecycle-plans.js";

const configuration = readConfig();
if (configuration.persistence.mode === "cloud") await ensureConfiguredMariaDbDatabase(process.env);

const persistence = createQcafePersistence(configuration.persistence, createQcafeLifecyclePlans());
try {
  const executed = await persistence.initialize();
  console.log(executed.length ? `Applied: ${executed.join(", ")}` : "Database migrations are current.");
  const records = await persistence.verify();
  console.log(`Verified ${records.length} lifecycle records after migration.`);
} finally {
  await persistence.destroy();
}
