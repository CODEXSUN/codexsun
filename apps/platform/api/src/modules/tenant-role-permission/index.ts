export { tenantRolePermissionModule } from "./tenant-role-permission.module.js";
export {
  migrateTenantRolePermissionModule,
  tenantRolePermissionMigration
} from "./tenant-role-permission.migration.js";
export { seedTenantRolePermissionModule } from "./tenant-role-permission.seed.js";
export type {
  TenantRolePermission,
  TenantRolePermissionSavePayload,
  TenantRolePermissionStatus
} from "./tenant-role-permission.types.js";

export { grantPortalRolePermissions } from "./tenant-role-permission.portal.js";
