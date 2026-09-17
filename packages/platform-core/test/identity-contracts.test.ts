import assert from "node:assert/strict";
import test from "node:test";
import { actorSchema, authorize, identitySessionSchema, type Actor } from "../src/index.js";

test("validates public actor and session contracts without credential fields", () => {
  const actor = actorSchema.parse({
    id: "user-1",
    kind: "user",
    roles: ["operator"],
    permissions: ["settings.read"],
  });
  const session = identitySessionSchema.parse({
    id: "session-1",
    actorId: actor.id,
    state: "active",
    issuedAt: "2026-09-17T00:00:00.000Z",
    expiresAt: "2026-09-18T00:00:00.000Z",
  });

  assert.equal(session.actorId, "user-1");
  assert.equal("token" in session, false);
});

test("allows an actor only when every required permission is assigned", () => {
  const actor = createActor(["settings.read", "settings.write"]);

  assert.deepEqual(authorize(actor, { permissions: ["settings.read", "settings.write"] }), {
    allowed: true,
    missingPermissions: [],
  });
});

test("reports missing permissions without treating a role as a permission", () => {
  const actor = createActor(["settings.read"]);

  assert.deepEqual(authorize(actor, { permissions: ["settings.write", "operator"] }), {
    allowed: false,
    missingPermissions: ["settings.write", "operator"],
  });
});

function createActor(permissions: string[]): Actor {
  return actorSchema.parse({ id: "user-1", kind: "user", roles: ["operator"], permissions });
}
