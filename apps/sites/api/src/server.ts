import cors from "@fastify/cors";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createPlatformRuntime, fastifyHelmetOptions, IdentityLoginRateLimitError, identityBrowserSessionIdSchema, identityErrorResponseSchema, identityLoginResponseSchema, identityLoginSchema, identityPasswordResetAcceptedSchema, identityPasswordResetConfirmationSchema, identityPasswordResetRequestSchema, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile, registerIdentityManagementRoutes } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { SitesContentProvider } from "./modules/content/provider.js";
import { SitesContentStore, type PublicSiteContent } from "./modules/content/content-store.js";
import { SitesFoundationProvider } from "./modules/foundation/provider.js";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();
const provider = new SitesFoundationProvider();
const contentProvider = new SitesContentProvider();
const content = new SitesContentStore(config.databasePath);
const profile = readApplicationDeployableProfile({ applicationId: "sites", availableProviderIds: ["platform.core", provider.manifest.id, contentProvider.manifest.id] });
const runtime = createPlatformRuntime(profile, [provider, contentProvider, ...(await loadEnabledAddonProviders(profile))]);
runtime.start();
const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
const siteRuntimes = {
  codexsun: { port: 7001 },
  devxcrew: { port: 7002 },
  logicx: { port: 7003 },
  skilloopz: { port: 7004 },
} as const;
type SiteRuntimeSlug = keyof typeof siteRuntimes;
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(helmet, fastifyHelmetOptions);
await app.register(cors, { origin: process.env.SITES_WEB_ORIGIN, methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"], allowedHeaders: ["Authorization", "Content-Type", "X-Codexsun-Browser-Session", "X-Codexsun-Auto-Login-Desk"] });
await app.register(swagger, { openapi: { info: { title: "Sites API", version: "1.0.0" }, openapi: "3.0.3" }, transform: jsonSchemaTransform });
await app.register(swaggerUi, { routePrefix: "/api/internal/reference", uiHooks: { onRequest: (request, reply, done) => { if (request.headers.authorization !== `Bearer ${config.apiReferenceToken}`) return reply.code(401).send({ error: "Authentication required." }); done(); } } });
app.setErrorHandler((error, _request, reply) => { app.log.error(error); return reply.code(500).send({ error: "Internal server error.", code: "server.internal" }); });
app.post("/api/v1/sites/auth/login", { schema: { body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
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
app.post("/api/v1/sites/auth/:portal/login", { schema: { params: z.object({ portal: z.enum(["admin", "super-admin"]) }), body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body); const portal = z.object({ portal: z.enum(["admin", "super-admin"]) }).safeParse(request.params); const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !portal.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  try { const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, portal.data.portal); return session ?? reply.code(401).send({ error: "Invalid login." }); } catch (error) { if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." }); throw error; }
});
app.post("/api/v1/sites/auth/password-reset/request", { schema: { body: identityPasswordResetRequestSchema, response: { 202: identityPasswordResetAcceptedSchema } } }, async (request, reply) => {
  const requestBody = identityPasswordResetRequestSchema.safeParse(request.body);
  const reset = requestBody.success ? await identity.requestPasswordReset(requestBody.data.identifier) : undefined;
  return reply.code(202).send({ message: "If the account exists, a reset request was created.", ...(config.exposeDevelopmentResetToken && reset ? { developmentToken: reset.token } : {}) });
});
app.post("/api/v1/sites/auth/password-reset/confirm", { schema: { body: identityPasswordResetConfirmationSchema, response: { 204: z.null(), 400: identityErrorResponseSchema } } }, async (request, reply) => {
  const confirmation = identityPasswordResetConfirmationSchema.safeParse(request.body);
  if (!confirmation.success || !(await identity.resetPassword(confirmation.data.token, confirmation.data.password))) return reply.code(400).send({ error: "The reset token is invalid or expired." });
  return reply.code(204).send(null);
});
app.post("/api/v1/sites/auth/development-login", async (request, reply) => {
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();
  return (await identity.autoLogin(browserSessionId.data, request.headers["x-codexsun-auto-login-desk"])) ?? reply.code(401).send({ error: "Development login is unavailable." });
});
app.addHook("onRequest", async (request, reply) => {
  if (isPublicPath(request.url)) return;
  if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) return reply.code(401).send({ error: "Authentication required." });
});
app.post("/api/v1/sites/auth/logout", async (request, reply) => reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send());
registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/sites" });
app.get("/api/v1/sites/public/clients", { schema: { response: { 200: z.array(z.unknown()) }, tags: ["Public Content"] } }, async (_request, reply) => reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300").send(content.listPublished()));
app.get("/api/v1/sites/public/clients/:slug", { schema: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/u) }), response: { 200: z.unknown(), 404: identityErrorResponseSchema }, tags: ["Public Content"] } }, async (request, reply) => {
  const site = content.findPublished(request.params.slug);
  return site ? reply.header("Cache-Control", "public, max-age=60, stale-while-revalidate=300").send(site) : reply.code(404).send({ error: "Client site not found." });
});
app.get("/api/v1/sites/content/:slug", { schema: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/u) }) } }, async (request, reply) => {
  const site = content.findEditable(request.params.slug);
  return site ?? reply.code(404).send({ error: "Client content not found." });
});
app.put("/api/v1/sites/content/:slug/draft", { schema: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/u) }), body: z.unknown() } }, async (request, reply) => {
  const current = content.findEditable(request.params.slug);
  if (!current) return reply.code(404).send({ error: "Client content not found." });
  const draft = normalizeEditableContent(request.body, current);
  return content.saveDraft(request.params.slug, draft) ?? reply.code(404).send({ error: "Client content not found." });
});
app.post("/api/v1/sites/content/:slug/publish", { schema: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/u) }) } }, async (request, reply) => {
  const result = content.publish(request.params.slug);
  return result ?? reply.code(404).send({ error: "Client content not found." });
});
app.post("/api/v1/sites/content/:slug/unpublish", { schema: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/u) }) } }, async (request, reply) => {
  const result = content.unpublish(request.params.slug);
  return result ?? reply.code(404).send({ error: "Client content not found." });
});
app.get("/api/v1/sites/content/:slug/revisions", { schema: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/u) }) } }, async (request, reply) => {
  if (!content.findEditable(request.params.slug)) return reply.code(404).send({ error: "Client content not found." });
  return content.listRevisions(request.params.slug);
});
app.post("/api/v1/sites/content/:slug/revisions/:revisionId/restore", { schema: { params: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/u), revisionId: z.coerce.number().int().positive() }) } }, async (request, reply) => {
  const result = content.restoreRevision(request.params.slug, request.params.revisionId);
  return result ?? reply.code(404).send({ error: "Revision not found." });
});
app.get("/api/v1/sites/health", { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } }, async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }));
app.get("/api/v1/sites/runtime", async () => {
  const entries = await Promise.all(Object.entries(siteRuntimes).map(async ([slug, definition]) => ({
    ...(await probeRuntime(definition.port)),
    slug,
    port: definition.port,
  })));
  return entries;
});
app.post("/api/v1/sites/runtime/:slug/start", { schema: { params: z.object({ slug: z.enum(["codexsun", "devxcrew", "logicx", "skilloopz"]) }) } }, async (request, reply) => {
  const slug = request.params.slug as SiteRuntimeSlug;
  const definition = siteRuntimes[slug];
  const existingProbe = await probeRuntime(definition.port);
  if (existingProbe.running) return { slug, port: definition.port, ...existingProbe, started: false };
  const root = resolve(import.meta.dirname, "../../../..");
  const launcher = resolve(root, "tools/sites-runtime.mjs");
  const child = spawn(process.execPath, [launcher, slug, "dev"], {
    cwd: root,
    detached: true,
    env: { ...process.env, VITE_SITES_API_URL: `http://${config.host}:${config.port}` },
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const probe = await probeRuntime(definition.port);
    if (probe.running) return { slug, port: definition.port, ...probe, started: true };
    await delay(250);
  }
  return reply.code(202).send({ slug, port: definition.port, ...(await probeRuntime(definition.port)), started: true });
});
app.addHook("onClose", () => { content.close(); identity.close(); runtime.stop(); });
await app.listen({ host: config.host, port: config.port });

function isPublicPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return path === "/api/v1/sites/auth/login"
    || path === "/api/v1/sites/auth/admin/login"
    || path === "/api/v1/sites/auth/super-admin/login"
    || path === "/api/v1/sites/auth/development-login"
    || path === "/api/v1/sites/auth/password-reset/request"
    || path === "/api/v1/sites/auth/password-reset/confirm"
    || path === "/api/v1/sites/public/clients"
    || path.startsWith("/api/v1/sites/public/clients/")
    || path === "/api/v1/sites/health"
    || path === "/api/internal/reference"
    || path.startsWith("/api/internal/reference/");
}

async function probeRuntime(port: number): Promise<{
  checkedAt: string;
  httpStatus: number | null;
  responseTimeMs: number | null;
  running: boolean;
  state: "degraded" | "live" | "stopped";
}> {
  const startedAt = performance.now();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1_000) });
    const responseTimeMs = Math.round(performance.now() - startedAt);
    return {
      checkedAt: new Date().toISOString(),
      httpStatus: response.status,
      responseTimeMs,
      running: true,
      state: response.ok ? "live" : "degraded",
    };
  } catch {
    return {
      checkedAt: new Date().toISOString(),
      httpStatus: null,
      responseTimeMs: null,
      running: false,
      state: "stopped",
    };
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function normalizeEditableContent(value: unknown, current: PublicSiteContent): PublicSiteContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return current;
  const candidate = value as Partial<PublicSiteContent>;
  return {
    ...current,
    ...(typeof candidate.name === "string" ? { name: candidate.name } : {}),
    ...(typeof candidate.description === "string" ? { description: candidate.description } : {}),
    ...(typeof candidate.statement === "string" ? { statement: candidate.statement } : {}),
    ...(typeof candidate.about === "string" ? { about: candidate.about } : {}),
    ...(candidate.seo && typeof candidate.seo === "object" ? { seo: { title: cleanText(candidate.seo.title, current.seo.title, 160), description: cleanText(candidate.seo.description, current.seo.description, 320), keywords: Array.isArray(candidate.seo.keywords) ? candidate.seo.keywords.filter((item): item is string => typeof item === "string").slice(0, 20) : current.seo.keywords } } : {}),
    ...(candidate.contact && typeof candidate.contact === "object" ? { contact: { label: cleanText(candidate.contact.label, current.contact.label, 120), email: cleanText(candidate.contact.email, current.contact.email, 254), phone: cleanText(candidate.contact.phone, current.contact.phone, 80) } } : {}),
    ...(candidate.socialLinks && Array.isArray(candidate.socialLinks) ? { socialLinks: candidate.socialLinks.filter((link): link is { label: string; href: string } => Boolean(link && typeof link === "object" && typeof link.label === "string" && typeof link.href === "string" && /^https?:\/\//u.test(link.href))).slice(0, 12) } : {}),
    ...(candidate.footer && typeof candidate.footer === "object" ? { footer: { tagline: cleanText(candidate.footer.tagline, current.footer.tagline, 240), copyright: cleanText(candidate.footer.copyright, current.footer.copyright, 240) } } : {}),
    ...(candidate.sections && Array.isArray(candidate.sections) ? { sections: candidate.sections.filter((section): section is PublicSiteContent["sections"][number] => Boolean(section && typeof section === "object" && typeof section.type === "string")).slice(0, 20) } : {}),
  };
}

function cleanText(value: unknown, fallback: string, maximum: number): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maximum) : fallback;
}
