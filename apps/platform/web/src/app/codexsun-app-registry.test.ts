import assert from "node:assert/strict";
import test from "node:test";
import {
  appRootPage,
  appRootUrl,
  appMenuFor,
  enabledAppIds,
  defaultLandingApp
} from "./app-registry";

test("CODEXSUN activation controls launcher and landing with three connected portal routes", () => {
  assert.equal(enabledAppIds(["crm"]).includes("codexsun"), false);
  assert.equal(enabledAppIds(["codexsun"]).includes("codexsun"), true);
  assert.equal(defaultLandingApp("codexsun", ["crm"]), "application");
  assert.equal(defaultLandingApp("codexsun", ["codexsun"]), "codexsun");
  assert.equal(appRootPage("codexsun"), "codexsun.frontdesk");
  assert.equal(appRootUrl("codexsun"), "/app/codexsun/frontdesk");
  const selected: string[] = [];
  const menu = appMenuFor("codexsun", "codexsun.approvals", (page) => selected.push(page));
  assert.equal(menu.items?.filter((item) => item.isActive).length, 1);
  for (const item of menu.items ?? []) item.onSelect?.();
  assert.deepEqual(selected, ["codexsun.frontdesk", "codexsun.workspace", "codexsun.approvals"]);
});
