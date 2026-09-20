import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { LocalIdentityStore, type LocalIdentityConfiguration } from "@codexsun/platform-core";
import { isPublicZetroPath, registerZetroIdentityRoutes } from "../routes.js";

test("protects Zetro chat routes with an application-scoped identity session", async () => {
  const directory = mkdtempSync(join(resolve(process.cwd(), "../../../dist"), "zetro-identity-test-"));
  const identity = new LocalIdentityStore(configuration(join(directory, "identity.sqlite")));
  const app = Fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  try {
    await identity.initialize();
    registerZetroIdentityRoutes(app, identity);
    app.get("/api/zetro/v1/chat/runtime", async () => ({ connected: true }));
    const browserSessionId = randomUUID();

    assert.equal((await app.inject({ method: "GET", url: "/api/zetro/v1/chat/runtime" })).statusCode, 401);
    const login = await app.inject({ body: { identifier: "zetro-user", password: "development-password" }, headers: { "x-codexsun-browser-session": browserSessionId }, method: "POST", url: "/api/zetro/v1/auth/login" });
    assert.equal(login.statusCode, 200);
    const token = (login.json() as { token: string }).token;
    const headers = { authorization: `Bearer ${token}`, "x-codexsun-browser-session": browserSessionId };

    assert.equal((await app.inject({ headers, method: "GET", url: "/api/zetro/v1/chat/runtime" })).statusCode, 200);
    assert.equal((await app.inject({ headers, method: "POST", url: "/api/zetro/v1/auth/logout" })).statusCode, 204);
    assert.equal((await app.inject({ headers, method: "GET", url: "/api/zetro/v1/chat/runtime" })).statusCode, 401);
  } finally {
    await app.close();
    identity.close();
    rmSync(directory, { force: true, recursive: true });
  }
});

test("exposes only identity entry points and health before sign-in", () => {
  assert.equal(isPublicZetroPath("/api/zetro/v1/auth/login"), true);
  assert.equal(isPublicZetroPath("/api/zetro/v1/health"), true);
  assert.equal(isPublicZetroPath("/api/zetro/v1/chat/runtime"), false);
});

function configuration(databasePath: string): LocalIdentityConfiguration {
  return {
    appMode: "development",
    applicationId: "zetro",
    autoLogin: false,
    databasePath,
    exposeDevelopmentResetToken: false,
    loginLockoutSeconds: 60,
    loginMaxFailures: 3,
    loginWindowSeconds: 60,
    passwordResetTokenTtlSeconds: 60,
    refreshSeeds: false,
    secret: "platform-jwt-test-secret-platform-jwt-test",
    seeds: [
      { login: "superadmin@example.test", name: "Super admin", password: "development-password", role: "super-admin", username: "superadmin" },
      { login: "admin@example.test", name: "Admin", password: "development-password", role: "admin", username: "admin" },
      { login: "user@example.test", name: "Zetro user", password: "development-password", role: "user", username: "zetro-user" },
    ],
  };
}
