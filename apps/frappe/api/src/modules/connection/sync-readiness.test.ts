import assert from "node:assert/strict";
import { test } from "node:test";
import { assertFrappeQueueWorkerEnabled } from "./sync-readiness.js";

test("Frappe background sync rejects enqueue when the queue worker is disabled", () => {
  assert.throws(() => assertFrappeQueueWorkerEnabled(false), /queue worker is disabled/);
});

test("Frappe background sync accepts enqueue when the queue worker is enabled", () => {
  assert.doesNotThrow(() => assertFrappeQueueWorkerEnabled(true));
});
