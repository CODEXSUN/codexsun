import assert from "node:assert/strict";
import test from "node:test";
import { HttpIdentitySessionGateway } from "../session/identity-session-gateway";

test("reads the current actor with a bearer token", async () => {
  let requestHeaders: Headers | undefined;
  const gateway = new HttpIdentitySessionGateway("https://platform.test", async (_input, init) => {
    requestHeaders = new Headers(init?.headers);
    return Response.json({ id: "user-1", kind: "user", roles: [], permissions: [] });
  });

  const actor = await gateway.readCurrentActor("signed-token");

  assert.equal(actor.id, "user-1");
  assert.equal(requestHeaders?.get("authorization"), "Bearer signed-token");
});

test("rejects an unsuccessful current-actor response", async () => {
  const gateway = new HttpIdentitySessionGateway(
    "https://platform.test",
    async () => new Response(null, { status: 401 }),
  );
  await assert.rejects(() => gateway.readCurrentActor("signed-token"), /not valid/u);
});
