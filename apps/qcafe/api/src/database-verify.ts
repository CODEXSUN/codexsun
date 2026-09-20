import { createQcafePersistence } from "./modules/foundation/persistence/qcafe-persistence.js";
import { readConfig } from "./config.js";
import { createQcafeLifecyclePlans } from "./qcafe-lifecycle-plans.js";

const configuration = readConfig();
const persistence = createQcafePersistence(configuration.persistence, createQcafeLifecyclePlans());
try {
  const records = await persistence.verify();
  console.log(`Verified ${records.length} lifecycle records for Q Cafe.`);
  for (const record of records) {
    console.log(
      `${record.kind}[${record.sequence}] ${record.descriptorId} sha256=${record.checksum} runs=${record.runCount}`,
    );
  }
} finally {
  await persistence.destroy();
}
