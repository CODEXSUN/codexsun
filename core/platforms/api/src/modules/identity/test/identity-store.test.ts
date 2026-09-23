import assert from "node:assert/strict";
import test from "node:test";
import { createPlatformIdentityStore } from "../identity-store.js";

test("runs platform identity migration and repeat-safe seed in SQLite", async () => {
  const store = await createPlatformIdentityStore({ connectionUrl: "sqlite://local", sqliteFilename: ":memory:", appMode: "development" });

  assert.deepEqual(await store.repository.findActorById("platform.operator"), {
    id: "platform.operator",
    kind: "service",
    roles: ["platform.operator"],
    permissions: ["platform.health.read"],
  });
  await store.close();
});

test("does not mutate an unprepared production identity database", async () => {
  await assert.rejects(
    createPlatformIdentityStore({ connectionUrl: "sqlite://local", sqliteFilename: ":memory:", appMode: "production" }),
    /migrations are not prepared/u,
  );
});
