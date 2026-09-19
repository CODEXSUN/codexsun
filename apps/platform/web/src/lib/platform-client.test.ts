import assert from "node:assert/strict";
import test from "node:test";
import { fetchPlatformHealth, getPlatformApiUrl, PlatformApiError } from "./platform-client.js";

test("validates the configured Platform API URL", () => {
  assert.equal(getPlatformApiUrl("https://platform.test/"), "https://platform.test");
  assert.throws(() => getPlatformApiUrl("relative"), PlatformApiError);
});

test("validates health payloads and preserves the abort signal", async () => {
  const controller = new AbortController();
  let receivedSignal: AbortSignal | undefined;
  const response = await fetchPlatformHealth(
    "https://platform.test",
    async (_input, init) => {
      receivedSignal = init?.signal ?? undefined;
      return Response.json({ status: "ok", providers: ["platform.core"], readiness: [] });
    },
    controller.signal,
  );
  assert.equal(receivedSignal, controller.signal);
  assert.deepEqual(response.providers, ["platform.core"]);
});

test("rejects invalid API payloads with a typed error", async () => {
  await assert.rejects(
    () => fetchPlatformHealth("https://platform.test", async () => Response.json({ status: "wrong" })),
    (error: unknown) => error instanceof PlatformApiError && error.code === "schema",
  );
});
