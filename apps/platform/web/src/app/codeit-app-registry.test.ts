import assert from "node:assert/strict";
import test from "node:test";
import { platformAppSaveSchema } from "../../../api/src/modules/app-registry/app-registry.schemas";
import { platformAppRegistry as apiRegistry } from "../../../api/src/modules/app-registry/app-registry.service";
import { appRegistrySchema } from "../modules/app-registry/app-registry.schema";
import {
  appMenuItemsFor,
  appRootUrl,
  appWorkspaceItems,
  defaultLandingApp,
  defaultTenantModuleKeys,
  enabledAppIds,
  platformAppRegistry
} from "./app-registry";

test("Codeit activation and catalog contracts agree across API and tenant launcher", () => {
  const app = platformAppRegistry.find((entry) => entry.id === "codeit");
  const apiApp = apiRegistry.find((entry) => entry.appId === "codeit");
  assert(app);
  assert(apiApp);
  const { id: _id, uuid: _uuid, ...payload } = apiApp;
  assert.equal(platformAppSaveSchema.safeParse(payload).success, true);
  assert.equal(appRegistrySchema.safeParse(payload).success, true);
  assert.equal(app.moduleKey, apiApp.moduleKey);
  assert.equal(app.stack, apiApp.stack);
  assert.equal(app.alwaysEnabled, false);
  assert.equal(enabledAppIds([...defaultTenantModuleKeys]).includes("codeit"), false);
  assert.equal(defaultLandingApp("codeit", []), "application");
  assert.equal(
    appWorkspaceItems(enabledAppIds([]), "application").some((item) => item.appId === "codeit"),
    false
  );
  const enabled = enabledAppIds(["codeit"]);
  assert.equal(defaultLandingApp("codeit", ["codeit"]), "codeit");
  assert.equal(appRootUrl("codeit"), "/app/codeit/overview");
  assert.equal(
    appWorkspaceItems(enabled, "codeit").find((item) => item.appId === "codeit")?.active,
    true
  );
  const selected: string[] = [];
  const menu = appMenuItemsFor("codeit", "codeit.settings", (page) => selected.push(page));
  menu.forEach((item) => item.onSelect?.());
  assert.deepEqual(selected, ["codeit.overview", "codeit.settings"]);
  assert.equal(menu.find((item) => item.title === "Settings")?.isActive, true);
});
