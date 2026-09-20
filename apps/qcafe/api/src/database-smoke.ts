import { config } from "dotenv";
import { resolve } from "node:path";
import { verifyQcafeDatabases } from "./modules/foundation/persistence/qcafe-database-verifier.js";
import { createQcafeLifecyclePlans } from "./qcafe-lifecycle-plans.js";

config({ path: resolve(process.cwd(), "../../../.env") });
config({ path: resolve(process.cwd(), ".app.env"), override: true });

const sqlitePath = requiredPath(process.env.QCAFE_SQLITE_PATH, "QCAFE_SQLITE_PATH");
const results = await verifyQcafeDatabases(process.env, sqlitePath, createQcafeLifecyclePlans());
for (const result of results) {
  const migrationSummary = result.migrations.length ? result.migrations.join(", ") : "no new migrations";
  console.log(`${result.driver}: ready (${result.lifecycleRecords} lifecycle records; ${migrationSummary})`);
}

function requiredPath(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`Set ${name}.`);
  return resolve(process.cwd(), value);
}
