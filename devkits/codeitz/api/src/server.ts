import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  createPlatformRuntime,
  fastifyHelmetOptions,
  IdentityLoginRateLimitError,
  identityBrowserSessionIdSchema,
  identityErrorResponseSchema,
  identityLoginResponseSchema,
  identityLoginSchema,
  identityPasswordResetAcceptedSchema,
  identityPasswordResetConfirmationSchema,
  identityPasswordResetRequestSchema,
  loadEnabledAddonProviders,
  LocalIdentityStore,
  readApplicationDeployableProfile,
  registerIdentityManagementRoutes,
} from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { CodeitzFoundationProvider } from "./modules/foundation/provider.js";
import { CodeitzEngineeringProvider } from "./modules/engineering/provider.js";
import { CodeitzLearningProvider } from "./modules/learning/provider.js";
import { CodeitzSkillsProvider } from "./modules/skills/provider.js";
import { CodeitzCapabilitiesProvider } from "./modules/capabilities/provider.js";
import { CodeitzMemoryProvider } from "./modules/memory/provider.js";
import { registerSweRoutes } from "./modules/engineering/routes/swe.routes.js";
import { registerLearningRoutes } from "./modules/learning/routes/learning.routes.js";
import { registerSkillsRoutes } from "./modules/skills/routes/skills.routes.js";
import { registerCapabilitiesRoutes } from "./modules/capabilities/routes/capabilities.routes.js";
import { registerMemoryRoutes } from "./modules/memory/routes/memory.routes.js";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();

const foundationProvider = new CodeitzFoundationProvider();
const engineeringProvider = new CodeitzEngineeringProvider();
const learningProvider = new CodeitzLearningProvider();
const skillsProvider = new CodeitzSkillsProvider();
const capabilitiesProvider = new CodeitzCapabilitiesProvider();
const memoryProvider = new CodeitzMemoryProvider();

// Ground engineering runner tasks with Memory Bank and Skill Organiser
engineeringProvider.setMemoryAndSkills(memoryProvider.service, skillsProvider.organiser);

const providers = [
  foundationProvider,
  engineeringProvider,
  learningProvider,
  skillsProvider,
  capabilitiesProvider,
  memoryProvider,
];

const profile = readApplicationDeployableProfile({
  applicationId: "codeitz",
  availableProviderIds: ["platform.core", ...providers.map((p) => p.manifest.id)],
});

const runtime = createPlatformRuntime(profile, [
  ...providers,
  ...(await loadEnabledAddonProviders(profile)),
]);
runtime.start();

const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(helmet, fastifyHelmetOptions);
await app.register(cors, {
  origin: process.env.CODEITZ_WEB_ORIGIN,
  methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Codexsun-Browser-Session", "X-Codexsun-Auto-Login-Desk"],
});

await app.register(swagger, {
  openapi: { info: { title: "Codeitz API", version: "1.0.0" }, openapi: "3.0.3" },
  transform: jsonSchemaTransform,
});

await app.register(swaggerUi, {
  routePrefix: "/api/internal/reference",
  uiHooks: {
    onRequest: (request, reply, done) => {
      if (request.headers.authorization !== `Bearer ${config.apiReferenceToken}`) {
        return reply.code(401).send({ error: "Authentication required." });
      }
      done();
    },
  },
});

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  return reply.code(500).send({ error: "Internal server error.", code: "server.internal" });
});

app.post("/api/v1/codeitz/auth/login", {
  schema: {
    body: identityLoginSchema,
    response: {
      200: identityLoginResponseSchema,
      400: identityErrorResponseSchema,
      401: identityErrorResponseSchema,
      429: identityErrorResponseSchema,
    },
  },
}, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !browserSessionId.success) {
    return reply.code(400).send({ error: "Invalid login request." });
  }
  try {
    const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, "user");
    return session ?? reply.code(401).send({ error: "Invalid login." });
  } catch (error) {
    if (error instanceof IdentityLoginRateLimitError) {
      return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
    }
    throw error;
  }
});

app.post("/api/v1/codeitz/auth/:portal/login", {
  schema: {
    params: z.object({ portal: z.enum(["admin", "super-admin"]) }),
    body: identityLoginSchema,
    response: {
      200: identityLoginResponseSchema,
      400: identityErrorResponseSchema,
      401: identityErrorResponseSchema,
      429: identityErrorResponseSchema,
    },
  },
}, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body);
  const portal = z.object({ portal: z.enum(["admin", "super-admin"]) }).safeParse(request.params);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !portal.success || !browserSessionId.success) {
    return reply.code(400).send({ error: "Invalid login request." });
  }
  try {
    const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, portal.data.portal);
    return session ?? reply.code(401).send({ error: "Invalid login." });
  } catch (error) {
    if (error instanceof IdentityLoginRateLimitError) {
      return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." });
    }
    throw error;
  }
});

app.post("/api/v1/codeitz/auth/password-reset/request", {
  schema: {
    body: identityPasswordResetRequestSchema,
    response: { 202: identityPasswordResetAcceptedSchema },
  },
}, async (request, reply) => {
  const requestBody = identityPasswordResetRequestSchema.safeParse(request.body);
  const reset = requestBody.success ? await identity.requestPasswordReset(requestBody.data.identifier) : undefined;
  return reply.code(202).send({
    message: "If the account exists, a reset request was created.",
    ...(config.exposeDevelopmentResetToken && reset ? { developmentToken: reset.token } : {}),
  });
});

app.post("/api/v1/codeitz/auth/password-reset/confirm", {
  schema: {
    body: identityPasswordResetConfirmationSchema,
    response: { 204: z.null(), 400: identityErrorResponseSchema },
  },
}, async (request, reply) => {
  const confirmation = identityPasswordResetConfirmationSchema.safeParse(request.body);
  if (!confirmation.success || !(await identity.resetPassword(confirmation.data.token, confirmation.data.password))) {
    return reply.code(400).send({ error: "The reset token is invalid or expired." });
  }
  return reply.code(204).send(null);
});

app.post("/api/v1/codeitz/auth/development-login", async (request, reply) => {
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();
  return (await identity.autoLogin(browserSessionId.data, request.headers["x-codexsun-auto-login-desk"])) ?? reply.code(401).send({ error: "Development login is unavailable." });
});

app.addHook("onRequest", async (request, reply) => {
  if (isPublicPath(request.url)) return;
  if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) {
    return reply.code(401).send({ error: "Authentication required." });
  }
});

app.post("/api/v1/codeitz/auth/logout", async (request, reply) =>
  reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send(),
);

registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/codeitz" });

// Register Codeitz Product Module Routes
registerSweRoutes(
  app,
  engineeringProvider.orchestrator,
  engineeringProvider.runner,
  engineeringProvider.codebaseGraph,
  engineeringProvider.gitOps,
  engineeringProvider.projects,
  engineeringProvider.patcher,
  engineeringProvider.stateGraph,
);
registerLearningRoutes(app, learningProvider.learningService);
registerSkillsRoutes(app, skillsProvider.skillService, skillsProvider.organiser);
registerCapabilitiesRoutes(app, capabilitiesProvider.service);
registerMemoryRoutes(app, memoryProvider.service);

app.get("/api/v1/codeitz/health", {
  schema: {
    response: {
      200: z.object({
        status: z.literal("ok"),
        providers: z.array(z.string()),
      }),
    },
    tags: ["System"],
  },
}, async () => ({
  status: "ok" as const,
  providers: [...runtime.enabledProviderIds],
}));

app.addHook("onClose", () => {
  identity.close();
  runtime.stop();
});

await app.listen({ host: config.host, port: config.port });

function isPublicPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return path === "/api/v1/codeitz/auth/login"
    || path === "/api/v1/codeitz/auth/admin/login"
    || path === "/api/v1/codeitz/auth/super-admin/login"
    || path === "/api/v1/codeitz/auth/development-login"
    || path === "/api/v1/codeitz/auth/password-reset/request"
    || path === "/api/v1/codeitz/auth/password-reset/confirm"
    || path === "/api/v1/codeitz/health"
    || path.startsWith("/api/v1/codeitz/swe")
    || path.startsWith("/api/v1/codeitz/learning")
    || path.startsWith("/api/v1/codeitz/skills")
    || path.startsWith("/api/v1/codeitz/capabilities")
    || path.startsWith("/api/v1/codeitz/memory")
    || path === "/api/internal/reference"
    || path.startsWith("/api/internal/reference/");
}
