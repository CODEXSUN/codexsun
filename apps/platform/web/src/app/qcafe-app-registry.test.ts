import assert from "node:assert/strict";
import test from "node:test";
import { appRootUrl, enabledAppIds, platformAppRegistry } from "./app-registry";

test("Q Cafe opens from the tenant launcher only when its module is enabled", () => {
  assert.equal(appRootUrl("qcafe"), "/app/qcafe");
  assert.equal(enabledAppIds(["qcafe"]).includes("qcafe"), true);
  assert.equal(enabledAppIds(["crm"]).includes("qcafe"), false);
  assert.equal(platformAppRegistry.find((app) => app.id === "qcafe")?.moduleKey, "qcafe");
});
