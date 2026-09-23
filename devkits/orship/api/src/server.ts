import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { resolve } from "node:path";
import { z } from "zod";
import { createMariaDbDataProvider, createPlatformRuntime, fastifyHelmetOptions, IdentityLoginRateLimitError, identityBrowserSessionIdSchema, identityErrorResponseSchema, identityLoginResponseSchema, identityLoginSchema, identityPasswordResetAcceptedSchema, identityPasswordResetConfirmationSchema, identityPasswordResetRequestSchema, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile, registerIdentityManagementRoutes } from "@codexsun/platform-core";
import { readConfig } from "./config";
import { InfrasStore } from "./modules/infras/infras-store";
import { MariaDbInfrasStore, type InfrasDatabase } from "./modules/infras/mariadb-store";
import { OrshipInfrasProvider } from "./modules/infras/provider";
import { registerInfrasRoutes } from "./modules/infras/routes";
import { registerDockerRoutes } from "./modules/docker/routes";
import { OrshipFoundationProvider } from "./modules/foundation/provider";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();
const provider = new OrshipFoundationProvider();
const infrasProvider = new OrshipInfrasProvider();
const infrasStore = config.databaseUrl.startsWith("mysql:")
  ? new MariaDbInfrasStore(createMariaDbDataProvider<InfrasDatabase>({ connectionUrl: config.databaseUrl }), {
    containerName: config.mariadbContainerName,
    database: config.mariadbDatabase,
    hostPort: config.mariadbHostPort,
    image: config.mariadbImage,
    network: config.mariadbNetwork,
  })
  : new InfrasStore(resolve(process.cwd(), "../../../storage/devkits/orship/private/data/orship_db.sqlite"));
if ("initialize" in infrasStore && typeof infrasStore.initialize === "function") await infrasStore.initialize();
const profile = readApplicationDeployableProfile({ applicationId: "orship", availableProviderIds: ["platform.core", provider.manifest.id, infrasProvider.manifest.id] });
const runtime = createPlatformRuntime(profile, [provider, infrasProvider, ...(await loadEnabledAddonProviders(profile))]);
runtime.start();
const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(helmet, fastifyHelmetOptions);
await app.register(cors, { origin: config.webOrigin, methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"], allowedHeaders: ["Authorization", "Content-Type", "X-Codexsun-Browser-Session", "X-Codexsun-Auto-Login-Desk"] });
await app.register(swagger, { openapi: { info: { title: "Orship API", version: "1.0.0" }, openapi: "3.0.3" }, transform: jsonSchemaTransform });
await app.register(swaggerUi, { routePrefix: "/api/internal/reference", uiHooks: { onRequest: (request, reply, done) => { if (request.headers.authorization !== `Bearer ${config.apiReferenceToken}`) return reply.code(401).send({ error: "Authentication required." }); done(); } } });
app.setErrorHandler((error, _request, reply) => {
  const statusCode = readHttpStatusCode(error);
  if (statusCode && statusCode < 500) {
    app.log.warn({ err: error }, "Request rejected.");
    return reply.code(statusCode).send({ error: readErrorMessage(error), code: "request.invalid" });
  }
  app.log.error(error);
  return reply.code(500).send({ error: "Internal server error.", code: "server.internal" });
});
app.get("/", async (_request, reply) => reply.redirect(config.webOrigin));
app.post("/api/v1/orship/auth/login", { schema: { body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  let session;
  try { session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, "user"); } catch (error) {
    if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
    throw error;
  }
  return session ?? reply.code(401).send({ error: "Invalid login." });
});
app.post("/api/v1/orship/auth/:portal/login", { schema: { params: z.object({ portal: z.enum(["admin", "super-admin"]) }), body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body); const portal = z.object({ portal: z.enum(["admin", "super-admin"]) }).safeParse(request.params); const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !portal.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  try { const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, portal.data.portal); return session ?? reply.code(401).send({ error: "Invalid login." }); } catch (error) { if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." }); throw error; }
});
app.post("/api/v1/orship/auth/password-reset/request", { schema: { body: identityPasswordResetRequestSchema, response: { 202: identityPasswordResetAcceptedSchema } } }, async (request, reply) => {
  const requestBody = identityPasswordResetRequestSchema.safeParse(request.body);
  const reset = requestBody.success ? await identity.requestPasswordReset(requestBody.data.identifier) : undefined;
  return reply.code(202).send({ message: "If the account exists, a reset request was created.", ...(config.exposeDevelopmentResetToken && reset ? { developmentToken: reset.token } : {}) });
});
app.post("/api/v1/orship/auth/password-reset/confirm", { schema: { body: identityPasswordResetConfirmationSchema, response: { 204: z.null(), 400: identityErrorResponseSchema } } }, async (request, reply) => {
  const confirmation = identityPasswordResetConfirmationSchema.safeParse(request.body);
  if (!confirmation.success || !(await identity.resetPassword(confirmation.data.token, confirmation.data.password))) return reply.code(400).send({ error: "The reset token is invalid or expired." });
  return reply.code(204).send(null);
});
app.post("/api/v1/orship/auth/development-login", async (request, reply) => {
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();
  return (await identity.autoLogin(browserSessionId.data, request.headers["x-codexsun-auto-login-desk"])) ?? reply.code(401).send({ error: "Development login is unavailable." });
});
app.addHook("onRequest", async (request, reply) => {
  if (isPublicPath(request.url)) return;
  if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) return reply.code(401).send({ error: "Authentication required." });
});
app.post("/api/v1/orship/auth/logout", async (request, reply) => reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send());
registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/orship" });
app.get("/api/v1/orship/health", { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } }, async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }));
await registerInfrasRoutes(app, infrasStore);
await registerDockerRoutes(app, { managerToken: config.dockerManagerToken, managerUrl: config.dockerManagerUrl });
app.addHook("onClose", () => { identity.close(); runtime.stop(); });
app.addHook("onClose", async () => { await infrasStore.close(); });
await app.listen({ host: config.host, port: config.port });

function isPublicPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return path === "/"
    || path === "/api/v1/orship/auth/login"
    || path === "/api/v1/orship/auth/admin/login"
    || path === "/api/v1/orship/auth/super-admin/login"
    || path === "/api/v1/orship/auth/development-login"
    || path === "/api/v1/orship/auth/password-reset/request"
    || path === "/api/v1/orship/auth/password-reset/confirm"
    || path === "/api/v1/orship/health"
    || path === "/api/internal/reference"
    || path.startsWith("/api/internal/reference/");
}

function readHttpStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return undefined;
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Invalid request.";
}
