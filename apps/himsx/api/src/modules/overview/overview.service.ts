import type { HimsxOverview, HimsxOverviewRequestContext } from "./overview.types.js";

export class HimsxOverviewService {
  constructor(private readonly context: HimsxOverviewRequestContext) {}

  getOverview(): HimsxOverview {
    return {
      actorEmail: this.context.actorEmail,
      appKey: "himsx",
      checkedAt: new Date().toISOString(),
      label: "Himsx",
      tenantCode: this.context.tenant.code,
      tenantName: this.context.tenant.name
    };
  }
}
