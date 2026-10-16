export const logicxErpOverviewPermissions = ["logicx-erp.overview.view"] as const;
export type LogicxErpOverviewPermission = (typeof logicxErpOverviewPermissions)[number];

export type LogicxErpOverview = {
  actorEmail: string;
  appKey: "logicx-erp";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
};

export type LogicxErpOverviewRequestContext = {
  actorEmail: string;
  authorize: (permission: LogicxErpOverviewPermission) => Promise<void>;
  tenant: { code: string; name: string };
};

// Tenant runtime tables written by the permission seed.
export type LogicxErpPermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; permission_id: number; role_id: number };
  app_roles: { id: number; key: string };
};
