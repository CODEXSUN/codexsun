import test from "node:test";
import assert from "node:assert/strict";
import { applyLiveActivity } from "./live-activity.js";

test("live activity replaces an in-flight tool row when it completes", () => {
  const started = applyLiveActivity([], { type: "activity", providerId: "ollama", phase: "running", status: "active", message: "Running fs.read", tool: "fs.read", callId: "call-1" });
  const completed = applyLiveActivity(started, { type: "activity", providerId: "ollama", phase: "running", status: "complete", message: "fs.read completed", tool: "fs.read", callId: "call-1", durationMs: 12 });
  assert.equal(completed.length, 1);
  assert.equal(completed[0]?.status, "complete");
  assert.equal(completed[0]?.durationMs, 12);
});

test("live activity keeps provider phases separate", () => {
  const activities = applyLiveActivity(
    applyLiveActivity([], { type: "activity", providerId: "ollama", phase: "working", status: "active", message: "Working" }),
    { type: "activity", providerId: "ollama", phase: "thinking", status: "active", message: "Thinking" },
  );
  assert.deepEqual(activities.map((activity) => activity.phase), ["working", "thinking"]);
});
