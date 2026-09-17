import assert from "node:assert/strict";
import test from "node:test";
import { loadDocsHealth } from "./docs-health.js";

test("reports a missing Docs API URL", async () => {
  assert.deepEqual(await loadDocsHealth(undefined), {
    status: "offline",
    message: "Docs API URL is not configured.",
  });
});
