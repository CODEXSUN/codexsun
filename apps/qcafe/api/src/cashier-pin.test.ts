import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { LocalIdentityStore } from "@codexsun/platform-core";
import { CASHIER_LOGIN, registerCashierPinRoutes } from "./cashier-pin.js";

const browserSession = "44444444-4444-4444-8444-444444444444";

function testStore(databasePath: string) {
  return new LocalIdentityStore({
    applicationId: "qcafe",
    appMode: "development",
    autoLogin: false,
    autoLoginDesk: "user",
    databasePath,
    exposeDevelopmentResetToken: false,
    loginLockoutSeconds: 900,
    loginMaxFailures: 5,
    loginWindowSeconds: 900,
    passwordResetTokenTtlSeconds: 900,
    refreshSeeds: false,
    secret: "test-secret-with-at-least-32-characters",
    seeds: [],
  });
}

async function setup() {
  const directory = mkdtempSync(join(tmpdir(), "qcafe-pin-"));
  const identity = testStore(join(directory, "identity.sqlite"));
  await identity.initialize();
  const app = Fastify();
  await registerCashierPinRoutes(app, identity);
  return { app, directory, identity };
}

test("cashier PIN setup runs once and PIN login returns a cashier session", async () => {
  const { app, directory, identity } = await setup();
  try {
    const status = await app.inject({ method: "GET", url: "/api/v1/qcafe/auth/pin" });
    assert.deepEqual(status.json(), { cashierLogin: CASHIER_LOGIN, pinSet: false, supported: true });

    const bad = await app.inject({ method: "POST", url: "/api/v1/qcafe/auth/pin/setup", payload: { pin: "12" } });
    assert.equal(bad.statusCode, 400);

    const missing = await app.inject({
      headers: { "x-codexsun-browser-session": browserSession },
      method: "POST",
      url: "/api/v1/qcafe/auth/pin/login",
      payload: { pin: "1234" },
    });
    assert.equal(missing.statusCode, 404);
    assert.equal(missing.json().error, "First setup required.");

    const created = await app.inject({ method: "POST", url: "/api/v1/qcafe/auth/pin/setup", payload: { pin: "1234" } });
    assert.equal(created.statusCode, 201);

    const again = await app.inject({ method: "POST", url: "/api/v1/qcafe/auth/pin/setup", payload: { pin: "9999" } });
    assert.equal(again.statusCode, 409);

    const wrong = await app.inject({
      headers: { "x-codexsun-browser-session": browserSession },
      method: "POST",
      url: "/api/v1/qcafe/auth/pin/login",
      payload: { pin: "9999" },
    });
    assert.equal(wrong.statusCode, 401);

    const login = await app.inject({
      headers: { "x-codexsun-browser-session": browserSession },
      method: "POST",
      url: "/api/v1/qcafe/auth/pin/login",
      payload: { pin: "1234" },
    });
    assert.equal(login.statusCode, 200);
    const session = login.json();
    assert.ok(session.token);
    assert.ok(session.actor.roles.includes("cashier"));

    const statusAfter = await app.inject({ method: "GET", url: "/api/v1/qcafe/auth/pin" });
    assert.equal(statusAfter.json().pinSet, true);
  } finally {
    await app.close();
    identity.close();
    rmSync(directory, { force: true, recursive: true });
  }
});
