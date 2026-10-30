export type EcommerceStorefrontRuntime = {
  state: "running" | "starting" | "stopped" | "unavailable" | "unhealthy";
  port: number | null;
};

export type EcommerceOverview = {
  actorEmail: string;
  appKey: "ecommerce";
  checkedAt: string;
  label: string;
  tenantCode: string;
  tenantName: string;
};
