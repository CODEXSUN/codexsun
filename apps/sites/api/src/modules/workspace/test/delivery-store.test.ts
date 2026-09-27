import assert from "node:assert/strict";
import test from "node:test";
import { SitesDeliveryStore } from "../delivery-store.js";

test("keeps handoff plans and action reports isolated per client", () => {
  const store = new SitesDeliveryStore({ databasePath: ":memory:" });
  store.syncClient("alpha");
  store.syncClient("beta");

  const alpha = store.read("alpha");
  assert.equal(alpha.workPlan.length, 6);
  assert.equal(alpha.developers.length, 3);
  assert.equal(
    store.updateWorkPlan(alpha.workPlan[0].id, { status: "in-progress", assigneeId: "design-lead" })?.assigneeId,
    "design-lead",
  );

  const report = store.createActionReport({
    clientSlug: "alpha",
    title: "Logo pending",
    summary: "Waiting for the approved logo asset.",
    priority: "high",
    ownerId: "design-lead",
  });
  assert.equal(report.clientSlug, "alpha");
  assert.equal(store.read("beta").actionReports.length, 0);

  const handoff = store.saveHandoff("alpha", {
    brief: "Build the approved portfolio concept.",
    successCriteria: ["Responsive pages"],
    assets: ["Logo pack"],
    accessNotes: "Use the client staging account.",
  });
  assert.deepEqual(store.readHandoff("alpha"), handoff);
  store.close();
});
