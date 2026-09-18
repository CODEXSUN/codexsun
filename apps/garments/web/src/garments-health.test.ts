import assert from "node:assert/strict";
import test from "node:test";
import { loadGarmentsHealth } from "./garments-health.js";

test("reports a missing Garments API URL", async () => {
  assert.deepEqual(await loadGarmentsHealth(undefined), {
    status: "offline",
    message: "Garments API URL is not configured.",
  });
});
