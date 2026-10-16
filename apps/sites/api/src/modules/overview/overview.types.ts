export const sitesOverviewPermissions = ["sites.overview.view"] as const;
export type SitesOverviewPermission = (typeof sitesOverviewPermissions)[number];

export type SitesOverview = {
  actorEmail: string;
  appKey: "sites";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
};

export type SitesOverviewRequestContext = {
  actorEmail: string;
  authorize: (permission: SitesOverviewPermission) => Promise<void>;
  tenant: { code: string; name: string };
};

// Tenant runtime tables written by the permission seed.
export type SitesPermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; permission_id: number; role_id: number };
  app_roles: { id: number; key: string };
};
