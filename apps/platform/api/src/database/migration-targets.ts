import { assertDatabaseName } from "./database-utils.js";
import type { Tenant } from "../modules/tenant/tenant.types.js";

export function tenantMigrationTargets<T extends Pick<Tenant, "dbName" | "status" | "tenantCode">>(
  tenants: T[]
): T[] {
  return tenants.filter((tenant) => {
    if (!tenant.dbName.trim() && tenant.status !== "active") return false;
    assertDatabaseName(tenant.dbName, `tenant database name for ${tenant.tenantCode}`);
    return true;
  });
}
