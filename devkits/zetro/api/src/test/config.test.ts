import assert from "node:assert/strict";
import test from "node:test";
import { assertLocalHost } from "../config";

test("allows only loopback Zetro API hosts", () => {
  assert.doesNotThrow(() => assertLocalHost("127.0.0.1"));
  assert.doesNotThrow(() => assertLocalHost("localhost"));
  assert.doesNotThrow(() => assertLocalHost("::1"));
  assert.throws(() => assertLocalHost("0.0.0.0"), /loopback/u);
});

test("allows the container listener only when explicitly enabled", () => {
  assert.doesNotThrow(() => assertLocalHost("0.0.0.0", true));
});
