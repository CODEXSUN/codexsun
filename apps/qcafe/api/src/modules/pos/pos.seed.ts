import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { QCafeDatabase } from "../../cloud/runtime.js";

export async function seedPosPermissions(database: Kysely<QCafeDatabase>) {
  for (const key of ["qcafe.pos.view", "qcafe.pos.create", "qcafe.pos.pay"]) {
    const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
    await sql`INSERT IGNORE INTO app_permissions (uuid, \`key\`, label, description, status, is_protected)
      VALUES (${uuid}, ${key}, ${key}, 'QCafe point of sale', 'active', TRUE)`.execute(database);
    await sql`INSERT IGNORE INTO app_role_permissions (uuid, role_id, permission_id, status, is_protected)
      SELECT ${createHash("sha256").update(`admin:${key}`).digest("hex").slice(0, 8)}, r.id, p.id, 'active', TRUE
      FROM app_roles r JOIN app_permissions p ON p.\`key\`=${key} WHERE r.\`key\`='admin'`.execute(
      database
    );
  }
}
