import type { ProviderEngine } from "@codexsun/framework";
import { apiError } from "@codexsun/contracts";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { JwtIdentityAuthenticator } from "./modules/identity/auth/jwt-identity-authenticator.js";
import { IdentityController } from "./modules/identity/controller/identity.controller.js";
import { registerIdentityRoutes } from "./modules/identity/routes/identity-routes.js";
import { SettingsController } from "./modules/settings/controller/settings.controller.js";
import { registerSettingsRoutes } from "./modules/settings/routes/settings-routes.js";
import { registerHealthRoute } from "./modules/system/routes/health-route.js";
import { isRequestValidationError } from "./openapi.js";

export async function registerPlatformRoutes(app: FastifyInstance, engine: ProviderEngine): Promise<void> {
  app.setNotFoundHandler((_request, reply) => reply.code(404).send(apiError("Route not found.", "route.not-found")));
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    if (isRequestValidationError(error)) {
      return reply.code(400).send(apiError("Invalid request.", "request.invalid"));
    }
    return reply.code(500).send(apiError("Internal server error.", "server.internal"));
  });
  const authenticator = engine.require<JwtIdentityAuthenticator>("identity.authenticator");
  await registerHealthRoute(app, engine);
  app.get(
    "/api/v1/platform/modules",
    {
      schema: {
        tags: ["System"],
        response: { 200: z.object({ providers: z.array(z.string()) }) },
      },
    },
    async () => ({ providers: engine.ids() }),
  );
  await registerIdentityRoutes(app, engine.require<IdentityController>("identity.controller"), authenticator);
  await registerSettingsRoutes(app, engine.require<SettingsController>("settings.controller"), (authorization) =>
    authenticator.authenticate(authorization),
  );
}
