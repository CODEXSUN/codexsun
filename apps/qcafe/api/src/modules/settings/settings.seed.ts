import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";
import { defaultCafeSettings } from "./settings.types.js";
export async function seedSettings(database: Kysely<QCafeDatabase>) {
  await sql`INSERT IGNORE INTO qcafe_settings(id,payload,updated_by) VALUES(1,${JSON.stringify(defaultCafeSettings)},'system@codexsun.local')`.execute(
    database
  );
}
