import test from "node:test";
import assert from "node:assert/strict";
import { decodeLspMessage, encodeLspMessage } from "../src/lsp-transport.js";

test("encodeLspMessage and decodeLspMessage round-trip one message", () => {
  const source = { jsonrpc: "2.0", id: 1, method: "initialize", params: { rootUri: null } };
  const encoded = encodeLspMessage(source);
  const decoded = decodeLspMessage(encoded);

  assert.ok(decoded);
  assert.deepEqual(decoded.message, source);
  assert.equal(decoded.rest.length, 0);
});

test("decodeLspMessage leaves trailing messages in the rest buffer", () => {
  const first = encodeLspMessage({ jsonrpc: "2.0", id: 1, method: "initialize" });
  const second = encodeLspMessage({ jsonrpc: "2.0", method: "initialized", params: {} });
  const decoded = decodeLspMessage(Buffer.concat([first, second]));

  assert.ok(decoded);
  assert.equal(decoded.rest.length, second.length);

  const next = decodeLspMessage(decoded.rest);
  assert.ok(next);
  assert.deepEqual(next.message, { jsonrpc: "2.0", method: "initialized", params: {} });
});

test("decodeLspMessage returns null for partial payloads", () => {
  const encoded = encodeLspMessage({ jsonrpc: "2.0", id: 2, method: "shutdown" });
  const partial = encoded.subarray(0, encoded.length - 4);

  assert.equal(decodeLspMessage(partial), null);
});
