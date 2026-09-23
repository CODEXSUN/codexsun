import assert from "node:assert/strict";
import test from "node:test";
import { createPlatformTelemetry } from "./telemetry.js";

test("telemetry is a no-op when no collector is configured", async () => {
  const telemetry = createPlatformTelemetry();

  telemetry.start();
  await telemetry.stop();

  assert.ok(telemetry);
});
