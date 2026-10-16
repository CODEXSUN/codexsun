export const ecommerceOverviewPermissions = ["ecommerce.overview.view"] as const;
export type EcommerceOverviewPermission = (typeof ecommerceOverviewPermissions)[number];

export type EcommerceOverview = {
  actorEmail: string;
  appKey: "ecommerce";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
};

export type EcommerceOverviewRequestContext = {
  actorEmail: string;
  authorize: (permission: EcommerceOverviewPermission) => Promise<void>;
  tenant: { code: string; name: string };
};

// Tenant runtime tables written by the permission seed.
export type EcommercePermissionDatabase = {
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; permission_id: number; role_id: number };
  app_roles: { id: number; key: string };
};
