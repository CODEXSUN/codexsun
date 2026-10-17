import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import { emptySpecialSettings } from "./special.types.js";
export async function seedSpecialSettings(database: Kysely<QCafeDatabase>) {
  await sql`INSERT IGNORE INTO qcafe_special_settings(id,payload,updated_by) VALUES(1,${JSON.stringify(emptySpecialSettings)},'system@codexsun.local')`.execute(
    database
  );
}
