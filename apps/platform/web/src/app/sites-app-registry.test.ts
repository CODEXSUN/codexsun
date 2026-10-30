import assert from "node:assert/strict";
import test from "node:test";
import {
  appMenuFor,
  appRootPage,
  appRootUrl,
  appWorkspaceItems,
  defaultLandingApp,
  enabledAppIds,
  platformAppRegistry
} from "./app-registry";

test("Site Studio appears in launcher and adheres to tenant app policy", () => {
  const siteApp = platformAppRegistry.find((app) => app.id === "sites");
  assert.ok(siteApp);
  assert.equal(siteApp.label, "Site Studio");
  assert.equal(siteApp.moduleKey, "sites");
  assert.equal(siteApp.stack, "sites");

  assert.equal(appRootPage("sites"), "sites.overview");
  assert.equal(appRootUrl("sites"), "/app/sites/overview");

  // Tenant policy: enabled only when granted in enabled module keys
  assert.equal(enabledAppIds(["sites"]).includes("sites"), true);
  assert.equal(enabledAppIds(["crm"]).includes("sites"), false);

  // Landing app policy: defaults to application when tenant policy does not grant sites
  assert.equal(defaultLandingApp("sites", ["sites"]), "sites");
  assert.equal(defaultLandingApp("sites", ["crm"]), "application");

  // App launcher wiring: present when tenant policy allows sites
  const launcherItemsWithSites = appWorkspaceItems(["sites"], "sites");
  const siteLauncherItem = launcherItemsWithSites.find((item) => item.appId === "sites");
  assert.ok(siteLauncherItem);
  assert.equal(siteLauncherItem.title, "Site Studio");
  assert.equal(siteLauncherItem.url, "/app/sites/overview");
  assert.equal(siteLauncherItem.active, true);

  // App launcher policy: absent when tenant policy disables sites
  const launcherItemsWithoutSites = appWorkspaceItems(["crm"], "crm");
  assert.equal(
    launcherItemsWithoutSites.some((item) => item.appId === "sites"),
    false
  );

  // App menu navigation
  const selected: string[] = [];
  const menu = appMenuFor("sites", "sites.overview", (page) => selected.push(page));
  assert.equal(menu.title, "Site Studio");
  assert.deepEqual(
    menu.items?.map((item) => item.title),
    ["Studio Dashboard", "Client Portfolios", "Guide"]
  );

  menu.items?.find((item) => item.title === "Guide")?.onSelect?.();
  assert.deepEqual(selected, ["sites.guide"]);
});
