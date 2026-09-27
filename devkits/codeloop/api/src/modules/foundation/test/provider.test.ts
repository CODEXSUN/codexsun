import test from "node:test";
import assert from "node:assert/strict";
import { CodeloopFoundationProvider } from "../provider.js";
import { isAgentCrewTarget } from "../provider-connection.js";

test("declares the codeloop provider contract", () => assert.equal(new CodeloopFoundationProvider().manifest.id, "codeloop.foundation"));

test("identifies agentcrew targets correctly", () => {
  assert.equal(isAgentCrewTarget("http://127.0.0.1:6411"), true);
  assert.equal(isAgentCrewTarget("http://localhost:6411/"), true);
  assert.equal(isAgentCrewTarget("http://127.0.0.1:11434"), false);
  assert.equal(isAgentCrewTarget("http://127.0.0.1:11434", "http://127.0.0.1:6411"), false);
  assert.equal(isAgentCrewTarget("http://my-host:8080/api/v1/agentcrew"), true);
});
