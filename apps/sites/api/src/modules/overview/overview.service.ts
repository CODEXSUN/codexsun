import type { SitesOverview, SitesOverviewRequestContext } from "./overview.types.js";

export class SitesOverviewService {
  constructor(private readonly context: SitesOverviewRequestContext) {}

  getOverview(): SitesOverview {
    return {
      actorEmail: this.context.actorEmail,
      appKey: "sites",
      checkedAt: new Date().toISOString(),
      label: "Sites",
      tenantCode: this.context.tenant.code,
      tenantName: this.context.tenant.name
    };
  }
}
