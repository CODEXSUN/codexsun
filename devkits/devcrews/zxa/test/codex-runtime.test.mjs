import assert from "node:assert/strict";
import test from "node:test";
import { EventEmitter } from "node:events";
import { CodexRuntime } from "../src/codex-runtime.mjs";

test("returns a device code and verification URL from the Codex CLI", async () => {
  const runtime = new CodexRuntime("codex", () => fakeProcess(`${JSON.stringify({ id: 0, result: {} })}\n${JSON.stringify({ id: 1, result: { type: "chatgptDeviceCode", userCode: "ABCD-EFGH", verificationUrl: "https://auth.openai.com/codex/device" } })}\n`));
  assert.deepEqual(await runtime.startDeviceCode(), { message: "Enter this one-time code in the browser to connect Codex.", status: "awaiting", userCode: "ABCD-EFGH", verificationUrl: "https://auth.openai.com/codex/device" });
});

function fakeProcess(output) {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = { write: () => true };
  child.kill = () => undefined;
  queueMicrotask(() => child.stdout.emit("data", Buffer.from(output)));
  return child;
}
