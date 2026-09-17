import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { apiError } from "@codexsun/contracts";
import type { Actor } from "@codexsun/platform-core";
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { FastifyRequest } from "fastify";
import type { PlatformApiInstance } from "./api-instance.js";
import type { JwtIdentityAuthenticator } from "./modules/identity/auth/jwt-identity-authenticator.js";

const apiReferencePermission = "platform.api-reference.read";

export async function registerOpenApi(app: PlatformApiInstance): Promise<void> {
  configureApiSchemas(app);
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "CODEXSUN Platform API",
        description: "Internal Platform API reference.",
        version: "1.0.0",
      },
    },
    hideUntagged: true,
    transform: jsonSchemaTransform,
  });
}

export function configureApiSchemas(app: PlatformApiInstance): void {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
}

export async function registerInternalApiReference(
  app: PlatformApiInstance,
  authenticator: JwtIdentityAuthenticator,
): Promise<void> {
  await app.register(swaggerUi, {
    routePrefix: "/api/internal/reference",
    uiHooks: { onRequest: (request, reply) => authorizeApiReference(request, reply, authenticator) },
  });
}

export function isRequestValidationError(error: unknown): boolean {
  return hasZodFastifySchemaValidationErrors(error);
}

async function authorizeApiReference(
  request: FastifyRequest,
  reply: { code(statusCode: number): { send(payload: unknown): unknown } },
  authenticator: JwtIdentityAuthenticator,
): Promise<unknown> {
  const actor = await authenticator.authenticate(request.headers.authorization);
  if (!actor)
    return reply.code(401).send(apiError("Authentication required.", "api-reference.authentication-required"));
  if (!canReadApiReference(actor))
    return reply.code(403).send(apiError("Access denied.", "api-reference.access-denied"));
}

function canReadApiReference(actor: Actor): boolean {
  return actor.permissions.includes(apiReferencePermission);
}
