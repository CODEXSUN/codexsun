import assert from "node:assert/strict";
import test from "node:test";
import { resolveThemeAttributes, themeDensities, themeNames } from "../src/theme/theme-contract.js";

test("publishes the approved theme and density selections", () => {
  assert.deepEqual(themeNames, ["dark", "light"]);
  assert.deepEqual(themeDensities, ["compact", "default", "relaxed"]);
  assert.deepEqual(resolveThemeAttributes({ theme: "dark", density: "default" }), {
    "data-theme": "dark",
    "data-density": "default",
  });
});
