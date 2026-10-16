import type { EcommerceOverview, EcommerceOverviewRequestContext } from "./overview.types.js";

export class EcommerceOverviewService {
  constructor(private readonly context: EcommerceOverviewRequestContext) {}

  getOverview(): EcommerceOverview {
    return {
      actorEmail: this.context.actorEmail,
      appKey: "ecommerce",
      checkedAt: new Date().toISOString(),
      label: "Ecommerce",
      tenantCode: this.context.tenant.code,
      tenantName: this.context.tenant.name
    };
  }
}
