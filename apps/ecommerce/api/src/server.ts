import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createPlatformRuntime, fastifyHelmetOptions, IdentityLoginRateLimitError, identityBrowserSessionIdSchema, identityErrorResponseSchema, identityLoginResponseSchema, identityLoginSchema, identityPasswordResetAcceptedSchema, identityPasswordResetConfirmationSchema, identityPasswordResetRequestSchema, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile, registerIdentityManagementRoutes } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { EcommerceFoundationProvider } from "./modules/foundation/provider.js";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();
const provider = new EcommerceFoundationProvider();
const profile = readApplicationDeployableProfile({ applicationId: "ecommerce", availableProviderIds: ["platform.core", provider.manifest.id] });
const runtime = createPlatformRuntime(profile, [provider, ...(await loadEnabledAddonProviders(profile))]);
runtime.start();
const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(helmet, fastifyHelmetOptions);
await app.register(cors, { origin: process.env.ECOMMERCE_WEB_ORIGIN, methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"], allowedHeaders: ["Authorization", "Content-Type", "X-Codexsun-Browser-Session", "X-Codexsun-Auto-Login-Desk"] });
await app.register(swagger, { openapi: { info: { title: "Ecommerce API", version: "1.0.0" }, openapi: "3.0.3" }, transform: jsonSchemaTransform });
await app.register(swaggerUi, { routePrefix: "/api/internal/reference", uiHooks: { onRequest: (request, reply, done) => { if (request.headers.authorization !== `Bearer ${config.apiReferenceToken}`) return reply.code(401).send({ error: "Authentication required." }); done(); } } });
app.setErrorHandler((error, _request, reply) => { app.log.error(error); return reply.code(500).send({ error: "Internal server error.", code: "server.internal" }); });
app.post("/api/v1/ecommerce/auth/login", { schema: { body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  try {
    const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, "user");
    return session ?? reply.code(401).send({ error: "Invalid login." });
  } catch (error) {
    if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
    throw error;
  }
});
app.post("/api/v1/ecommerce/auth/:portal/login", { schema: { params: z.object({ portal: z.enum(["admin", "super-admin"]) }), body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body);
  const portal = z.object({ portal: z.enum(["admin", "super-admin"]) }).safeParse(request.params);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !portal.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  try { const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, portal.data.portal); return session ?? reply.code(401).send({ error: "Invalid login." }); } catch (error) { if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." }); throw error; }
});
app.post("/api/v1/ecommerce/auth/password-reset/request", { schema: { body: identityPasswordResetRequestSchema, response: { 202: identityPasswordResetAcceptedSchema } } }, async (request, reply) => {
  const requestBody = identityPasswordResetRequestSchema.safeParse(request.body);
  const reset = requestBody.success ? await identity.requestPasswordReset(requestBody.data.identifier) : undefined;
  return reply.code(202).send({ message: "If the account exists, a reset request was created.", ...(config.exposeDevelopmentResetToken && reset ? { developmentToken: reset.token } : {}) });
});
app.post("/api/v1/ecommerce/auth/password-reset/confirm", { schema: { body: identityPasswordResetConfirmationSchema, response: { 204: z.null(), 400: identityErrorResponseSchema } } }, async (request, reply) => {
  const confirmation = identityPasswordResetConfirmationSchema.safeParse(request.body);
  if (!confirmation.success || !(await identity.resetPassword(confirmation.data.token, confirmation.data.password))) return reply.code(400).send({ error: "The reset token is invalid or expired." });
  return reply.code(204).send(null);
});
app.post("/api/v1/ecommerce/auth/development-login", async (request, reply) => {
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();
  return (await identity.autoLogin(browserSessionId.data, request.headers["x-codexsun-auto-login-desk"])) ?? reply.code(401).send({ error: "Development login is unavailable." });
});
app.addHook("onRequest", async (request, reply) => {
  if (isPublicPath(request.url)) return;
  if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) return reply.code(401).send({ error: "Authentication required." });
});
app.post("/api/v1/ecommerce/auth/logout", async (request, reply) => reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send());
registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/ecommerce" });
app.get("/api/v1/ecommerce/health", { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } }, async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }));
app.addHook("onClose", () => { identity.close(); runtime.stop(); });
await app.listen({ host: config.host, port: config.port });

function isPublicPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return path === "/api/v1/ecommerce/auth/login"
    || path === "/api/v1/ecommerce/auth/admin/login"
    || path === "/api/v1/ecommerce/auth/super-admin/login"
    || path === "/api/v1/ecommerce/auth/development-login"
    || path === "/api/v1/ecommerce/auth/password-reset/request"
    || path === "/api/v1/ecommerce/auth/password-reset/confirm"
    || path === "/api/v1/ecommerce/health"
    || path === "/api/internal/reference"
    || path.startsWith("/api/internal/reference/");
}
