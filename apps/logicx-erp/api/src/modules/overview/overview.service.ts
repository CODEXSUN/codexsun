import type { LogicxErpOverview, LogicxErpOverviewRequestContext } from "./overview.types.js";

export class LogicxErpOverviewService {
  constructor(private readonly context: LogicxErpOverviewRequestContext) {}

  getOverview(): LogicxErpOverview {
    return {
      actorEmail: this.context.actorEmail,
      appKey: "logicx-erp",
      checkedAt: new Date().toISOString(),
      label: "LogicX ERP",
      tenantCode: this.context.tenant.code,
      tenantName: this.context.tenant.name
    };
  }
}
