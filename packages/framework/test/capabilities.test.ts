import assert from "node:assert/strict";
import test from "node:test";
import { evaluateWorkflowTransition } from "../src/capabilities.js";

test("workflow transition helper checks current state and permission", () => {
  const transitions = [{ event: "approve", from: "draft", to: "approved", permission: "records.approve" }] as const;

  assert.deepEqual(evaluateWorkflowTransition({ state: "draft", event: "approve", transitions }), {
    allowed: false,
    reason: "permission-required",
  });
  assert.deepEqual(evaluateWorkflowTransition({
    state: "draft",
    event: "approve",
    transitions,
    permissions: new Set(["records.approve"]),
  }), { allowed: true, transition: transitions[0] });
  assert.deepEqual(evaluateWorkflowTransition({ state: "approved", event: "approve", transitions }), {
    allowed: false,
    reason: "unknown-transition",
  });
});
