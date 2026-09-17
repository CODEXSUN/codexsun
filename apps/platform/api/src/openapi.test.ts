import assert from "node:assert/strict";
import test from "node:test";
import { ProviderEngine, type ModuleProvider, type ProviderRegistrationContext } from "@codexsun/framework";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { SignJWT } from "jose";
import { JwtIdentityAuthenticator } from "./modules/identity/auth/jwt-identity-authenticator.js";
import { InMemoryIdentityRepository } from "./modules/identity/repository/identity.repository.js";
import { IdentityService } from "./modules/identity/service/identity.service.js";
import { registerInternalApiReference, registerOpenApi } from "./openapi.js";
import { SettingsController } from "./modules/settings/controller/settings.controller.js";
import { InMemorySettingsRepository } from "./modules/settings/repository/settings.repository.js";
import { SettingsService } from "./modules/settings/service/settings.service.js";
import { IdentityController } from "./modules/identity/controller/identity.controller.js";
import { registerPlatformRoutes } from "./routes.js";

const authentication = {
  secret: "openapi-test-secret-openapi-test-secret",
  issuer: "codexsun-platform",
  audience: "codexsun-platform-api",
};

test("protects the internal API reference and documents tagged Platform routes", async () => {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  const identityService = new IdentityService(
    new InMemoryIdentityRepository([
      { id: "api-reader", kind: "user", roles: [], permissions: ["platform.api-reference.read"] },
    ]),
  );
  const authenticator = new JwtIdentityAuthenticator(authentication, identityService);
  const engine = createReadyEngine(
    authenticator,
    new IdentityController(identityService),
    new SettingsController(new SettingsService(new InMemorySettingsRepository([]))),
  );

  await registerOpenApi(app);
  await registerPlatformRoutes(app, engine);
  await registerInternalApiReference(app, authenticator);
  await app.ready();

  const denied = await app.inject({ method: "GET", url: "/api/internal/reference/json" });
  assert.equal(denied.statusCode, 401);
  const deniedUi = await app.inject({ method: "GET", url: "/api/internal/reference/" });
  assert.equal(deniedUi.statusCode, 401);

  const invalidActor = await app.inject({ method: "GET", url: "/api/v1/identity/actors/%20" });
  assert.equal(invalidActor.statusCode, 400);
  assert.deepEqual(invalidActor.json(), { error: "Invalid request.", code: "request.invalid" });

  const allowed = await app.inject({
    method: "GET",
    url: "/api/internal/reference/json",
    headers: { authorization: `Bearer ${await createToken("api-reader")}` },
  });
  assert.equal(allowed.statusCode, 200);
  const paths = allowed.json().paths;
  assert.ok(paths["/api/v1/platform/health"]);
  assert.ok(paths["/api/v1/platform/modules"]);
  assert.ok(paths["/api/v1/identity/actors/me"]);
  assert.ok(paths["/api/v1/identity/actors/{actorId}"]);
  assert.ok(paths["/api/v1/platform/settings"]);

  await app.close();
});

function createReadyEngine(
  authenticator: JwtIdentityAuthenticator,
  identityController: IdentityController,
  settingsController: SettingsController,
): ProviderEngine {
  const engine = new ProviderEngine();
  const provider: ModuleProvider = {
    manifest: {
      id: "platform.test",
      owner: "apps/platform/api/openapi.test",
      version: "1.0.0",
      dependencies: [],
      contracts: ["platform.test"],
      events: { published: [], consumed: [] },
    },
    register(context: ProviderRegistrationContext): void {
      context.provide("identity.authenticator", authenticator);
      context.provide("identity.controller", identityController);
      context.provide("settings.controller", settingsController);
    },
  };
  engine.register(provider);
  engine.start();
  return engine;
}

async function createToken(actorId: string): Promise<string> {
  return new SignJWT()
    .setSubject(actorId)
    .setIssuer(authentication.issuer)
    .setAudience(authentication.audience)
    .setExpirationTime("5m")
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(authentication.secret));
}
