import assert from "node:assert/strict";
import test from "node:test";
import { loadZetroHealth } from "./zetro-health.js";

test("reports an unavailable Zetro API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 503 });

  try {
    assert.deepEqual(await loadZetroHealth(), {
      status: "offline",
      message: "Zetro API is unavailable.",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
