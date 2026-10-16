export const docsOverviewPermissions = ["docs.overview.view"] as const;
export type DocsOverviewPermission = (typeof docsOverviewPermissions)[number];

export type DocsOverview = {
  actorEmail: string;
  appKey: "docs";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
};

export type DocsOverviewRequestContext = {
  actorEmail: string;
  authorize: (permission: DocsOverviewPermission) => Promise<void>;
  tenant: { code: string; name: string };
};

// Tenant runtime tables written by the permission seed.
export type DocsPermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; permission_id: number; role_id: number };
  app_roles: { id: number; key: string };
};
