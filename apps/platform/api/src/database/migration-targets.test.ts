import assert from "node:assert/strict";
import test from "node:test";
import { tenantMigrationTargets } from "./migration-targets.js";

test("skip unprovisioned non-active tenants while retaining configured inactive databases", () => {
  const live = { tenantCode: "LIVE", status: "active" as const, dbName: "live_db" };
  const inactive = { tenantCode: "OLD", status: "inactive" as const, dbName: "old_db" };
  assert.deepEqual(
    tenantMigrationTargets([
      live,
      inactive,
      { tenantCode: "DRAFT", status: "inactive", dbName: "" },
      { tenantCode: "NEW", status: "provisioning", dbName: "" }
    ]),
    [live, inactive]
  );
});
test("an active tenant without a database or any unsafe configured database still blocks release", () => {
  assert.throws(
    () => tenantMigrationTargets([{ tenantCode: "LIVE", status: "active", dbName: "" }]),
    /Invalid tenant database/
  );
  assert.throws(
    () => tenantMigrationTargets([{ tenantCode: "OLD", status: "inactive", dbName: "unsafe;db" }]),
    /Invalid tenant database/
  );
});
