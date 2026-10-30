import { AttendanceRepository } from "../attendance/attendance.repository.js";
import type { HrmsOverview, HrmsOverviewRequestContext } from "./overview.types.js";

export class HrmsOverviewService {
  constructor(private readonly context: HrmsOverviewRequestContext) {}

  async getOverview(): Promise<HrmsOverview> {
    const attendance = await new AttendanceRepository(this.context.database).overviewToday();
    return {
      actorEmail: this.context.actorEmail,
      appKey: "hrms",
      checkedAt: new Date().toISOString(),
      label: "HRMS",
      tenantCode: this.context.tenant.code,
      tenantName: this.context.tenant.name,
      attendance
    };
  }
}
