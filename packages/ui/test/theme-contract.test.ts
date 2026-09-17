import assert from "node:assert/strict";
import test from "node:test";
import { resolveThemeAttributes, themeDensities, themeNames } from "../src/theme/theme-contract.js";
import { createUiRegistry, uiRegistry } from "../src/registry/ui-registry.js";

test("publishes the approved theme and density selections", () => {
  assert.deepEqual(themeNames, ["dark", "light"]);
  assert.deepEqual(themeDensities, ["compact", "default", "relaxed"]);
  assert.deepEqual(resolveThemeAttributes({ theme: "dark", density: "default" }), {
    "data-theme": "dark",
    "data-density": "default",
  });
});

test("publishes valid public metadata for every shared UI item", () => {
  assert.equal(uiRegistry.length, 18);
  assert.equal(uiRegistry[0]?.id, "ui.component.button");
  assert.throws(() => createUiRegistry([uiRegistry[0]!, uiRegistry[0]!]), /Duplicate UI registry ID/u);
});
