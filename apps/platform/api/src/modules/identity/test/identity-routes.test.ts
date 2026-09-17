import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { SignJWT } from "jose";
import { JwtIdentityAuthenticator } from "../auth/jwt-identity-authenticator.js";
import { IdentityController } from "../controller/identity.controller.js";
import { InMemoryIdentityRepository } from "../repository/identity.repository.js";
import { registerIdentityRoutes } from "../routes/identity-routes.js";
import { IdentityService } from "../service/identity.service.js";

const authentication = {
  secret: "identity-route-test-secret-identity-route-test",
  issuer: "codexsun-platform",
  audience: "codexsun-platform-api",
};

async function createToken(actorId: string): Promise<string> {
  return new SignJWT()
    .setSubject(actorId)
    .setIssuer(authentication.issuer)
    .setAudience(authentication.audience)
    .setExpirationTime("5m")
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(authentication.secret));
}

function createAuthenticator(repository: InMemoryIdentityRepository): JwtIdentityAuthenticator {
  return new JwtIdentityAuthenticator(authentication, new IdentityService(repository));
}

test("allows a signed actor to read only its own identity", async () => {
  const app = Fastify();
  const repository = new InMemoryIdentityRepository([
    { id: "user-1", kind: "user", roles: ["operator"], permissions: [] },
    { id: "user-2", kind: "user", roles: ["operator"], permissions: [] },
    { id: "administrator-1", kind: "user", roles: ["administrator"], permissions: ["identity.read"] },
  ]);
  await registerIdentityRoutes(
    app,
    new IdentityController(new IdentityService(repository)),
    createAuthenticator(repository),
  );

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/identity/actors/user-1",
    headers: { authorization: `Bearer ${await createToken("user-1")}` },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    id: "user-1",
    kind: "user",
    roles: ["operator"],
    permissions: [],
  });

  const isolated = await app.inject({
    method: "GET",
    url: "/api/v1/identity/actors/user-2",
    headers: { authorization: `Bearer ${await createToken("user-1")}` },
  });
  assert.equal(isolated.statusCode, 403);

  const authorized = await app.inject({
    method: "GET",
    url: "/api/v1/identity/actors/user-2",
    headers: { authorization: `Bearer ${await createToken("administrator-1")}` },
  });
  assert.equal(authorized.statusCode, 200);

  const current = await app.inject({
    method: "GET",
    url: "/api/v1/identity/actors/me",
    headers: { authorization: `Bearer ${await createToken("user-1")}` },
  });
  assert.equal(current.statusCode, 200);
  assert.equal(current.json().id, "user-1");
  await app.close();
});

test("rejects missing and invalid credentials, then preserves not-found responses", async () => {
  const app = Fastify();
  const repository = new InMemoryIdentityRepository([
    { id: "user-1", kind: "user", roles: ["operator"], permissions: [] },
  ]);
  await registerIdentityRoutes(
    app,
    new IdentityController(new IdentityService(repository)),
    createAuthenticator(repository),
  );

  const missingCredential = await app.inject({ method: "GET", url: "/api/v1/identity/actors/missing" });
  assert.equal(missingCredential.statusCode, 401);

  const invalidCredential = await app.inject({
    method: "GET",
    url: "/api/v1/identity/actors/missing",
    headers: { authorization: "Bearer invalid.token.value" },
  });
  assert.equal(invalidCredential.statusCode, 401);

  const missing = await app.inject({
    method: "GET",
    url: "/api/v1/identity/actors/missing",
    headers: { authorization: `Bearer ${await createToken("user-1")}` },
  });
  assert.equal(missing.statusCode, 404);

  const unknownActor = await app.inject({
    method: "GET",
    url: "/api/v1/identity/actors/user-1",
    headers: { authorization: `Bearer ${await createToken("unknown")}` },
  });
  assert.equal(unknownActor.statusCode, 401);
  await app.close();
});
