import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { hrmsOverviewModule } from "../../apps/hrms/api/src/index.js";
import { docsOverviewModule } from "@codexsun/docs-api";
import { himsxOverviewModule } from "@codexsun/himsx-api";
import { sitesOverviewModule } from "@codexsun/sites-api";
import { AppError } from "@codexsun/framework/errors";
import { AttendanceRepository } from "../../apps/hrms/api/src/modules/attendance/attendance.repository.js";

AttendanceRepository.prototype.overviewToday = async () => ({
  activeEmployees: 0,
  markedToday: 0,
  presentToday: 0,
  absentToday: 0,
  leaveToday: 0,
  holidayToday: 0,
  notMarkedToday: 0,
  attendanceRate: 0,
  today: "2026-10-14",
  week: [],
  recent: []
});

for (const [key, module] of [
  ["hrms", hrmsOverviewModule],
  ["docs", docsOverviewModule],
  ["himsx", himsxOverviewModule],
  ["sites", sitesOverviewModule]
] as const) {
  test(`${key} overview requires the owning permission and returns injected tenant context`, async () => {
    const app = Fastify();
    let allowed = false;
    const permissions: string[] = [];
    await (module as any).register(app, async () => ({
      actorEmail: "staff@example.test",
      tenant: { code: "TENANT-A", name: "Tenant A" },
      authorize: async (permission: string) => {
        permissions.push(permission);
        if (!allowed) throw AppError.forbidden("Access denied");
      }
    }));
    try {
      assert.equal((await app.inject({ method: "GET", url: `/${key}/overview` })).statusCode, 403);
      allowed = true;
      const response = await app.inject({ method: "GET", url: `/${key}/overview` });
      assert.equal(response.statusCode, 200);
      const result = response.json().data;
      assert.equal(result.appKey, key);
      assert.equal(result.tenantCode, "TENANT-A");
      assert.equal(result.actorEmail, "staff@example.test");
      assert.deepEqual(permissions, [`${key}.overview.view`, `${key}.overview.view`]);
    } finally {
      await app.close();
    }
  });
}
