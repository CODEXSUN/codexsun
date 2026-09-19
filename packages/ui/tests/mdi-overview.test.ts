import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("sets Overview as the default leading sidebar action", () => {
  const source = readFileSync(new URL("../src/layouts/mdi-main/mdi-main.tsx", import.meta.url), "utf8");

  assert.match(source, /primaryAction = \{ icon: LayoutDashboardIcon, label: "Overview" \}/u);
  assert.doesNotMatch(source, /label: "New workspace"/u);
});
