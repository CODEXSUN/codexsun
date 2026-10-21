import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { registerDutyReportRoutes } from "./duty-report.routes.js";
import type { DutyReportContext } from "./duty-report.types.js";

function reportApp(permissions: string[]) {
  const app = Fastify();
  registerDutyReportRoutes(app, async () => ({
    actorEmail: "member@example.test",
    actorUserId: 10,
    database: {} as DutyReportContext["database"],
    authorize: async (permission) => {
      if (!permissions.includes(permission)) throw AppError.forbidden(`Missing ${permission}`);
    }
  }));
  return app;
}

test("own-report users can load overview capabilities without team-wide access", async (t) => {
  const app = reportApp(["crm.duty-report.view.own", "crm.duty-report.create.own"]);
  t.after(() => app.close());
  const response = await app.inject("/crm/duty-reports/options");
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().data, {
    actorUserId: 10,
    canCreate: true,
    canViewAll: false
  });
});

test("report managers retain team-wide capability flags", async (t) => {
  const app = reportApp(["crm.duty-report.view.all"]);
  t.after(() => app.close());
  const response = await app.inject("/crm/duty-reports/options");
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.canViewAll, true);
  assert.equal(response.json().data.canCreate, false);
});

test("users without report read permission cannot load report capabilities", async (t) => {
  const app = reportApp([]);
  t.after(() => app.close());
  assert.equal((await app.inject("/crm/duty-reports/options")).statusCode, 403);
});

test("own-report users still cannot read team reports or summaries", async (t) => {
  const app = reportApp(["crm.duty-report.view.own"]);
  t.after(() => app.close());
  assert.equal((await app.inject("/crm/duty-reports?scope=all")).statusCode, 403);
  assert.equal((await app.inject("/crm/duty-reports/summary")).statusCode, 403);
});
