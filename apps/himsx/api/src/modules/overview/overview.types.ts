export const himsxOverviewPermissions = ["himsx.overview.view"] as const;
export type HimsxOverviewPermission = (typeof himsxOverviewPermissions)[number];

export type HimsxOverview = {
  actorEmail: string;
  appKey: "himsx";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
};

export type HimsxOverviewRequestContext = {
  actorEmail: string;
  authorize: (permission: HimsxOverviewPermission) => Promise<void>;
  tenant: { code: string; name: string };
};

// Tenant runtime tables written by the permission seed.
export type HimsxPermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; permission_id: number; role_id: number };
  app_roles: { id: number; key: string };
};
