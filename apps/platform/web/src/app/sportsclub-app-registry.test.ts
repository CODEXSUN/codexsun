import assert from "node:assert/strict";
import test from "node:test";
import {
  appRootUrl,
  appWorkspaceItems,
  defaultLandingApp,
  enabledAppIds,
  platformAppRegistry
} from "./app-registry";
import { appRegistrySchema } from "../modules/app-registry/app-registry.schema";

test("Sports Club appears in the launcher only for enabled tenants", () => {
  const app = platformAppRegistry.find((item) => item.id === "sportsclub");
  assert.ok(app);
  assert.equal(app.moduleKey, "sportsclub");
  assert.equal(appRootUrl("sportsclub"), "/app/sportsclub/overview");

  assert.equal(enabledAppIds(["platform.tenant", "sportsclub"]).includes("sportsclub"), true);
  assert.equal(enabledAppIds(["platform.tenant"]).includes("sportsclub"), false);
  assert.equal(defaultLandingApp("sportsclub", ["sportsclub"]), "sportsclub");
  assert.equal(defaultLandingApp("sportsclub", ["platform.tenant"]), "application");

  const launcher = appWorkspaceItems(enabledAppIds(["sportsclub"]), "sportsclub");
  assert.equal(launcher.find((item) => item.appId === "sportsclub")?.active, true);
  assert.equal(
    appWorkspaceItems(enabledAppIds(["platform.tenant"]), "application").some(
      (item) => item.appId === "sportsclub"
    ),
    false
  );

  assert.equal(
    appRegistrySchema.safeParse({
      alwaysEnabled: false,
      appId: "sportsclub",
      defaultLanding: false,
      description: app.description,
      label: app.label,
      moduleKey: app.moduleKey,
      stack: app.stack
    }).success,
    true
  );
});
