import type { DocsOverview, DocsOverviewRequestContext } from "./overview.types.js";

export class DocsOverviewService {
  constructor(private readonly context: DocsOverviewRequestContext) {}

  getOverview(): DocsOverview {
    return {
      actorEmail: this.context.actorEmail,
      appKey: "docs",
      checkedAt: new Date().toISOString(),
      label: "Docs",
      tenantCode: this.context.tenant.code,
      tenantName: this.context.tenant.name
    };
  }
}
