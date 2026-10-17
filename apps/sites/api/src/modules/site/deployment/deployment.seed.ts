import { createHash } from "node:crypto";
import type { SitesPermissionDatabase } from "../../overview/index.js";
import { sql, type Kysely } from "kysely";
export const deploymentPermissions = [
  "sites.site.deployment.view",
  "sites.site.deployment.retry"
] as const;
export async function seedDeploymentPermissions(database: Kysely<SitesPermissionDatabase>) {
  for (const key of deploymentPermissions) {
    const uuid = createHash("sha256").update(key).digest("hex").slice(0, 8);
    await sql`INSERT INTO app_permissions(uuid,${sql.ref("key")},label,description,status,is_protected) VALUES(${uuid},${key},${key},${key},'active',TRUE) ON DUPLICATE KEY UPDATE label=VALUES(label)`.execute(
      database
    );
  }
}
