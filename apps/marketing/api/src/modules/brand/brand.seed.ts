import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { MarketingDatabase } from "../../context.js";
export async function seedBrand(database: Kysely<MarketingDatabase>) {
  for (const action of ["view", "create", "update", "manage-all"]) {
    const key = "marketing.brand.record." + action;
    const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
    await sql`INSERT INTO app_permissions(uuid,\`key\`,label,description,status,is_protected) VALUES(${uuid},${key},${"Marketing Brand " + action},${"Allows Marketing Brand " + action},'active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label)`.execute(
      database
    );
    await sql`INSERT INTO app_role_permissions(uuid,role_id,permission_id,status,is_protected)
   SELECT ${createHash("sha256")
     .update("admin:" + key)
     .digest("hex")
     .slice(
       0,
       8
     )},r.id,p.id,'active',TRUE FROM app_roles r JOIN app_permissions p ON p.\`key\`=${key} WHERE r.\`key\`='admin'
   ON DUPLICATE KEY UPDATE uuid=app_role_permissions.uuid`.execute(database);
  }
}
