import assert from "node:assert/strict";
import test from "node:test";
import { createPlatformQueryClient } from "./query-client.js";

test("uses shared Platform query defaults", () => {
  const client = createPlatformQueryClient();
  assert.equal(client.getDefaultOptions().queries?.retry, 2);
  assert.equal(client.getDefaultOptions().queries?.staleTime, 15_000);
  assert.equal(client.getDefaultOptions().queries?.refetchOnWindowFocus, false);
});
