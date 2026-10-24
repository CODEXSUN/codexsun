import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { listSources, removeSource } from "./migration.services.js";

function respond(t: TestContext, response: Response) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: () => "test-slot" }
  });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "sessionStorage", descriptor);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  });
  return t.mock.method(globalThis, "fetch", async () => response);
}

test("source lookup preserves the API URL and authenticated tab context", async (t) => {
  const fetch = respond(t, Response.json({ success: true, data: [] }));
  assert.deepEqual(await listSources(), []);
  const call = fetch.mock.calls[0]!;
  assert.equal(call.arguments[0], "/api/data-migration/sources");
  assert.equal(call.arguments[1]?.credentials, "include");
  assert.equal(new Headers(call.arguments[1]?.headers).get("x-codexsun-session-slot"), "test-slot");
});

test("an HTML SPA fallback reports the missing API route without exposing its body", async (t) => {
  respond(
    t,
    new Response("<!doctype html><html>private proxy page</html>", {
      headers: { "content-type": "text/html" }
    })
  );
  await assert.rejects(listSources(), (error: Error) => {
    assert.match(error.message, /non-JSON.*\/api\/data-migration/u);
    assert.doesNotMatch(error.message, /Unexpected token|private proxy page/u);
    return true;
  });
});

test("an unavailable proxy reports its HTTP status", async (t) => {
  respond(
    t,
    new Response("<html>Bad Gateway</html>", {
      status: 502,
      headers: { "content-type": "text/html" }
    })
  );
  await assert.rejects(listSources(), /API is unavailable.*HTTP 502/u);
});

test("malformed JSON and malformed envelopes have stable diagnostics", async (t) => {
  respond(t, new Response("broken", { headers: { "content-type": "application/json" } }));
  await assert.rejects(listSources(), /invalid JSON/u);
});

test("JSON without the response envelope cannot be treated as a source list", async (t) => {
  respond(t, Response.json({ unexpected: "content" }));
  await assert.rejects(listSources(), /invalid response/u);
});

test("server authorization errors retain their request ID", async (t) => {
  respond(
    t,
    Response.json(
      {
        success: false,
        error: { message: "Super Admin required" },
        meta: { requestId: "req-test" }
      },
      { status: 403 }
    )
  );
  await assert.rejects(listSources(), /Super Admin required \(Request ID: req-test\)/u);
});

test("mutations retain the request method and JSON payload", async (t) => {
  const fetch = respond(t, Response.json({ success: true, data: { deleted: true } }));
  await removeSource(5);
  const call = fetch.mock.calls[0]!;
  assert.equal(call.arguments[0], "/api/data-migration/sources/5/remove");
  assert.equal(call.arguments[1]?.method, "POST");
  assert.equal(call.arguments[1]?.body, "{}");
});
