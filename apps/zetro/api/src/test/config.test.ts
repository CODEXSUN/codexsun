import assert from "node:assert/strict";
import test from "node:test";
import { assertLocalHost } from "../config.js";

test("allows only loopback Zetro API hosts", () => {
  assert.doesNotThrow(() => assertLocalHost("127.0.0.1"));
  assert.doesNotThrow(() => assertLocalHost("localhost"));
  assert.doesNotThrow(() => assertLocalHost("::1"));
  assert.throws(() => assertLocalHost("0.0.0.0"), /loopback/u);
});
