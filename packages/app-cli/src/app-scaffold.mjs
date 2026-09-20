import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadRegistry } from "./registry.mjs";
import { syncMdiCatalog } from "./mdi-catalog.mjs";

export function createApplication(rootDir, options) {
  const registry = loadRegistry(rootDir);
  const application = createManifest(options, registry.applications);
  const applicationPath = resolve(registry.root, "apps", application.id);
  if (existsSync(applicationPath)) throw new Error(`Application already exists: apps/${application.id}.`);

  writeApplicationFiles(registry.root, application);
  writeJson(resolve(registry.root, "registry", "applications", `${application.id}.json`), application);
  enableInDevelopmentProfile(registry.root, application);
  registerRootMdiPort(registry.root, application);
  registerWorkspaceLock(registry.root, application);
  registerRootScripts(registry.root, application);
  registerTurboOutputs(registry.root, application);
  syncMdiCatalog(registry.root);
  return application;
}

function createManifest(options, applications) {
  const id = String(options.id ?? "").trim();
  if (!/^[a-z][a-z0-9-]*$/u.test(id)) throw new Error("Application ID must use lowercase kebab case.");
  const taskPrefix = String(options.taskPrefix ?? id[0]).trim();
  if (!/^[a-z]$/u.test(taskPrefix) || applications.some((application) => application.taskPrefix === taskPrefix)) {
    throw new Error("Application taskPrefix must be one unused lowercase letter.");
  }
  const apiPort = readPort(options.apiPort, 6200);
  const webPort = readPort(options.webPort, 6201);
  if (apiPort === webPort) throw new Error("API and web ports must differ.");
  const label = String(options.label ?? titleCase(id)).trim();
  const key = environmentKey(id);
  return {
    schemaVersion: 1,
    kind: "application",
    id,
    label,
    owner: `apps/${id}`,
    taskPrefix,
    providers: ["platform.core", `${id}.foundation`],
    mdi: { icon: "application", localUrlKey: `VITE_${key}_WEB_URL`, path: "/" },
    hosts: [
      { kind: "api", target: `${id}-api`, displayName: `${label} API`, environmentDirectory: "api", envKey: `${key}_API_PORT`, workspace: `@codexsun/${id}-api`, defaultPort: apiPort },
      { kind: "web", target: `${id}-web`, displayName: `${label} web`, environmentDirectory: "web", envKey: `${key}_WEB_PORT`, workspace: `@codexsun/${id}-web`, defaultPort: webPort },
    ],
  };
}

function writeApplicationFiles(root, application) {
  const [api, web] = application.hosts;
  const key = environmentKey(application.id);
  const version = workspaceVersion(root);
  write(root, `apps/${application.id}/README.md`, `# ${application.label}\n\nThis application owns its product modules and composition.\n\nRun dependency installation only from the repository root. The app never owns a node_modules, dist, or .turbo directory.\n`);
  write(root, `apps/${application.id}/agent/skills.md`, agentSkillsSource(application));
  write(root, `apps/${application.id}/agent/exec/${application.id}-task.md`, agentTaskSource(application));
  write(root, `apps/${application.id}/api/package.json`, apiPackage(application, version));
  write(root, `apps/${application.id}/api/tsconfig.json`, '{ "extends": "../../../tsconfig.base.json", "include": ["src", "test"] }\n');
  write(root, `apps/${application.id}/api/.app.env.example`, `PLATFORM_HOST=127.0.0.1\n${api.envKey}=${api.defaultPort}\n${key}_WEB_ORIGIN=http://127.0.0.1:${web.defaultPort}\n${key}_API_REFERENCE_TOKEN=change-this-local-token\nAPP_MODE=development\nAUTO_LOGIN=0\nREFRESH_IDENTITY_SEED=0\nIDENTITY_LOGIN_MAX_FAILURES=5\nIDENTITY_LOGIN_WINDOW_SECONDS=900\nIDENTITY_LOGIN_LOCKOUT_SECONDS=900\nIDENTITY_PASSWORD_RESET_TOKEN_TTL_SECONDS=900\nIDENTITY_EXPOSE_DEVELOPMENT_RESET_TOKEN=0\nPLATFORM_JWT_SECRET=change-this-to-a-32-character-minimum-secret\nSUPER_ADMIN_NAME=super-admin\nSUPER_ADMIN_LOGIN=superadmin@superadmin.com\nSUPER_ADMIN_USERNAME=superadmin\nSUPER_ADMIN_PASSWORD=change_pass\nADMIN_NAME=Admin\nADMIN_LOGIN=admin@changepass.com\nADMIN_USERNAME=admin\nADMIN_PASSWORD=change_pass\nUSER_NAME=User\nUSER_LOGIN=user@changepass.com\nUSER_USERNAME=user\nUSER_PASSWORD=change_pass\n`);
  write(root, `apps/${application.id}/api/README.md`, `# ${application.label} API\n\nThe API exposes typed Zod routes and a protected internal OpenAPI reference.\n`);
  write(root, `apps/${application.id}/api/src/config.ts`, apiConfigSource(application));
  write(root, `apps/${application.id}/api/src/server.ts`, apiSourceV5(application));
  write(root, `apps/${application.id}/api/src/server.test.ts`, apiTestSource(application));
  write(root, `apps/${application.id}/api/src/mariadb.integration.test.ts`, mariaDbTestSource(application));
  write(root, `apps/${application.id}/api/src/modules/foundation/provider.ts`, providerSource(application));
  write(root, `apps/${application.id}/api/src/modules/foundation/README.md`, `# ${application.label} Foundation Module\n\nThis module owns the application health provider.\n`);
  write(root, `apps/${application.id}/api/src/modules/foundation/test/provider.test.ts`, providerTestSource(application));
  write(root, `apps/${application.id}/web/package.json`, webPackage(application, version));
  write(root, `apps/${application.id}/web/tsconfig.json`, '{ "extends": "../../../tsconfig.base.json", "compilerOptions": { "module": "ESNext", "moduleResolution": "Bundler", "jsx": "react-jsx", "noEmit": true, "types": ["vite/client"] }, "include": ["src", "vite.config.ts"] }\n');
  write(root, `apps/${application.id}/web/.app.env.example`, `PLATFORM_HOST=127.0.0.1\n${web.envKey}=${web.defaultPort}\nVITE_${key}_API_URL=http://127.0.0.1:${api.defaultPort}\n`);
  write(root, `apps/${application.id}/web/README.md`, `# ${application.label} Web\n\nThe web host composes the shared MDI workspace. Vite cache files write to dist/.vite/apps/${application.id}/web.\n`);
  write(root, `apps/${application.id}/web/index.html`, '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
  write(root, `apps/${application.id}/web/src/main.tsx`, 'import "@codexsun/ui/globals.css";\nimport { QueryClient, QueryClientProvider } from "@tanstack/react-query";\nimport { createRoot } from "react-dom/client";\nimport { App } from "./app";\n\nconst queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 15_000, refetchOnWindowFocus: false } } });\ncreateRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);\n');
  write(root, `apps/${application.id}/web/src/app.tsx`, webAppSource(application));
  write(root, `apps/${application.id}/web/vite.config.ts`, viteSourceV2(application));
}

function enableInDevelopmentProfile(root, application) {
  const path = resolve(root, "registry", "profiles", "development.json");
  const profile = JSON.parse(requireText(path));
  profile.enabledApplications = [...new Set([...profile.enabledApplications, application.id])].sort();
  profile.enabledProviders = { ...profile.enabledProviders, [application.id]: application.providers };
  writeJson(path, profile);
}

function registerRootMdiPort(root, application) {
  const path = resolve(root, ".env");
  if (!existsSync(path)) return;
  const [, web] = application.hosts;
  const key = application.mdi.localUrlKey;
  if (new RegExp(`^${key}=`, "mu").test(readFileSync(path, "utf8"))) return;
  appendFileSync(path, `\n${key}=${web.defaultPort}\n`, "utf8");
}

function apiPackage(application, version) {
  return { name: `@codexsun/${application.id}-api`, version, private: true, type: "module", scripts: { build: "esbuild src/server.ts --bundle --platform=node --format=esm --outfile=../../../dist/" + application.id + "/api/server.js", check: "tsc -p tsconfig.json --noEmit", dev: "tsx watch src/server.ts", lint: "eslint src", test: "tsx --test src/server.test.ts src/mariadb.integration.test.ts src/modules/foundation/test/provider.test.ts" }, dependencies: { "@codexsun/framework": "file:../../../packages/framework", "@codexsun/platform-core": "file:../../../packages/platform-core", "@fastify/cors": "^11.3.0", "@fastify/helmet": "^13.1.1", "@fastify/swagger": "^9.8.1", "@fastify/swagger-ui": "^6.1.1", dotenv: "^17.0.0", fastify: "^5.0.0", "fastify-type-provider-zod": "^4.0.2", zod: "^3.25.76" } };
}

function webPackage(application, version) {
  return { name: `@codexsun/${application.id}-web`, version, private: true, type: "module", scripts: { build: "vite build", check: "tsc -p tsconfig.json --noEmit", dev: "vite", lint: "eslint src", test: "tsx --test" }, dependencies: { "@codexsun/ui": "file:../../../packages/ui", "@tailwindcss/vite": "^4.0.0", "@tanstack/react-query": "^5.103.1", "@vitejs/plugin-react": "^5.0.0", dotenv: "^17.0.0", react: "^19.0.0", "react-dom": "^19.0.0", vite: "^7.0.0" } };
}

function legacyWebAppSource(application) {
  return `import { useQuery } from "@tanstack/react-query";\nimport { MainWorkspace } from "@codexsun/ui";\nimport { SessionBoundary } from "@codexsun/ui/blocks/auth";\nimport { LayoutDashboardIcon } from "lucide-react";\n\ntype Health = { status: "ok"; providers: string[] };\n\nexport function App() {\n  return <SessionBoundary applicationId="${application.id}" applicationName="${application.label}" autoLoginPath="/api/v1/${application.id}/auth/development-login" loginPath="/api/v1/${application.id}/auth/login">{(session) => <Desk request={session.fetch} logout={session.logout} />}</SessionBoundary>;\n}\n\nfunction Desk({ request, logout }: { request: typeof fetch; logout: () => void }) {\n  const health = useQuery({ queryKey: ["${application.id}", "health"], queryFn: () => readHealth(request) });\n  const status = health.isPending ? "Connecting to API…" : health.isError ? "API connection failed." : \`API ready: \${health.data.status}\`;\n\n  return (\n    <MainWorkspace applicationId="${application.id}" applicationName="${application.label}" primaryAction={{ icon: LayoutDashboardIcon, label: "Overview" }} user={{ initials: "${application.label[0]}", name: "${application.label} user", onSignOut: logout }} workspaceTitle="Overview">\n      <main className="p-6">\n        <h1 className="text-lg font-semibold">${application.label} overview</h1>\n        <p className="mt-1 text-sm text-muted-foreground">Start ${application.label} with app-owned modules, routes, and views in one workspace.</p>\n        <p className="mt-3 text-sm text-muted-foreground">{status}</p>\n      </main>\n    </MainWorkspace>\n  );\n}\n\nasync function readHealth(request: typeof fetch): Promise<Health> {\n  const response = await request("/api/v1/${application.id}/health", { signal: AbortSignal.timeout(5_000) });\n  if (!response.ok) throw new Error(\`Health request failed: \${response.status}\`);\n  return response.json() as Promise<Health>;\n}\n`;
}

function webAppSource(application) {
  return `import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";

export function App() {
  return <SessionBoundary applicationId="${application.id}" applicationName="${application.label}" autoLoginPath="/api/v1/${application.id}/auth/development-login" loginPath="/api/v1/${application.id}/auth/login">
    {(session) => session.portal === "super-admin" ? <IdentityManagementDesk applicationId="${application.id}" applicationName="${application.label}" logout={session.logout} request={session.fetch} /> : session.portal === "admin" ? <PrivilegedDesk applicationId="${application.id}" applicationName="${application.label}" logout={session.logout} portal={session.portal} /> : <Desk logout={session.logout} />}
  </SessionBoundary>;
}

function Desk({ logout }: { logout(): void }) {
  return <MainWorkspace applicationId="${application.id}" applicationName="${application.label}" primaryAction={{ label: "Overview" }} user={{ initials: "${application.label[0]}", name: "${application.label} user", onSignOut: logout }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">${application.label} overview</h1><p className="mt-1 text-sm text-muted-foreground">Start with application-owned modules and shared identity access.</p></main></MainWorkspace>;
}
`;
}

function providerSource(application) {
  const name = className(application.id);
  return `import type { ModuleProvider } from "@codexsun/framework";\n\nexport class ${name}FoundationProvider implements ModuleProvider {\n  readonly manifest = { id: "${application.id}.foundation", owner: "apps/${application.id}/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["${application.id}.health"], events: { published: [], consumed: [] } };\n  register(): void {}\n}\n`;
}

function apiConfigSource(application) {
  const [api] = application.hosts;
  const key = environmentKey(application.id);
  return `import { readLocalIdentityConfiguration } from "@codexsun/platform-core";\nimport { config } from "dotenv";\nimport { resolve } from "node:path";\n\nexport function readConfig() {\n  config({ path: resolve(process.cwd(), "../../../.env") });\n  config({ path: resolve(process.cwd(), ".app.env"), override: true });\n  const port = Number(process.env.${api.envKey});\n  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set ${api.envKey} to a valid port.");\n  const host = process.env.PLATFORM_HOST;\n  if (!host) throw new Error("Set PLATFORM_HOST.");\n  const apiReferenceToken = process.env.${key}_API_REFERENCE_TOKEN;\n  if (!apiReferenceToken) throw new Error("Set ${key}_API_REFERENCE_TOKEN.");\n  return { apiReferenceToken, host, port, ...readLocalIdentityConfiguration(process.env, { applicationId: "${application.id}", databasePath: resolve(process.cwd(), "../../../storage/apps/${application.id}/private/data/${application.id}_db.sqlite") }) };\n}\n`;
}

function apiSourceV2(application) {
  const name = className(application.id);
  return `import swagger from "@fastify/swagger";\nimport swaggerUi from "@fastify/swagger-ui";\nimport Fastify from "fastify";\nimport { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";\nimport { z } from "zod";\nimport { createPlatformRuntime, readApplicationDeployableProfile } from "@codexsun/platform-core";\nimport { readConfig } from "./config.js";\nimport { ${name}FoundationProvider } from "./modules/foundation/provider.js";\n\nconst config = readConfig();\nconst provider = new ${name}FoundationProvider();\nconst runtime = createPlatformRuntime(\n  readApplicationDeployableProfile({ applicationId: "${application.id}", availableProviderIds: ["platform.core", provider.manifest.id] }),\n  [provider],\n);\nruntime.start();\nconst app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();\napp.setValidatorCompiler(validatorCompiler);\napp.setSerializerCompiler(serializerCompiler);\nawait app.register(swagger, {\n  openapi: { info: { title: "${application.label} API", version: "1.0.0" }, openapi: "3.0.3" },\n  transform: jsonSchemaTransform,\n});\nawait app.register(swaggerUi, {\n  routePrefix: "/api/internal/reference",\n  uiHooks: {\n    onRequest: (request, reply, done) => {\n      if (request.headers.authorization !== \`Bearer \${config.apiReferenceToken}\`) return reply.code(401).send({ error: "Authentication required." });\n      done();\n    },\n  },\n});\napp.get(\n  "/api/v1/${application.id}/health",\n  { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } },\n  async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }),\n);\napp.addHook("onClose", () => runtime.stop());\nawait app.listen({ host: config.host, port: config.port });\n`;
}

function apiSourceV3(application) {
  const name = className(application.id);
  const key = environmentKey(application.id);
  return `import cors from "@fastify/cors";\nimport helmet from "@fastify/helmet";\nimport swagger from "@fastify/swagger";\nimport swaggerUi from "@fastify/swagger-ui";\nimport Fastify from "fastify";\nimport { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";\nimport { z } from "zod";\nimport { createPlatformRuntime, loadEnabledAddonProviders, readApplicationDeployableProfile } from "@codexsun/platform-core";\nimport { readConfig } from "./config.js";\nimport { ${name}FoundationProvider } from "./modules/foundation/provider.js";\n\nconst config = readConfig();\nconst provider = new ${name}FoundationProvider();\nconst profile = readApplicationDeployableProfile({ applicationId: "${application.id}", availableProviderIds: ["platform.core", provider.manifest.id] });\nconst runtime = createPlatformRuntime(profile, [provider, ...(await loadEnabledAddonProviders(profile))]);\nruntime.start();\nconst app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();\napp.setValidatorCompiler(validatorCompiler);\napp.setSerializerCompiler(serializerCompiler);\nawait app.register(helmet);\nawait app.register(cors, { origin: process.env.${key}_WEB_ORIGIN, methods: ["GET", "HEAD", "OPTIONS"], allowedHeaders: ["Authorization", "Content-Type"] });\nawait app.register(swagger, { openapi: { info: { title: "${application.label} API", version: "1.0.0" }, openapi: "3.0.3" }, transform: jsonSchemaTransform });\nawait app.register(swaggerUi, { routePrefix: "/api/internal/reference", uiHooks: { onRequest: (request, reply, done) => { if (request.headers.authorization !== \`Bearer \${config.apiReferenceToken}\`) return reply.code(401).send({ error: "Authentication required." }); done(); } } });\napp.setErrorHandler((error, _request, reply) => { app.log.error(error); return reply.code(500).send({ error: "Internal server error.", code: "server.internal" }); });\napp.get("/api/v1/${application.id}/health", { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } }, async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }));\napp.addHook("onClose", () => runtime.stop());\nawait app.listen({ host: config.host, port: config.port });\n`;
}

// Kept temporarily so applications generated before the hardened template remain traceable.
void apiSourceV2;

function apiSourceV4(application) {
  const name = className(application.id);
  const key = environmentKey(application.id);
  return `import cors from "@fastify/cors";\nimport helmet from "@fastify/helmet";\nimport swagger from "@fastify/swagger";\nimport swaggerUi from "@fastify/swagger-ui";\nimport Fastify from "fastify";\nimport { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";\nimport { z } from "zod";\nimport { createPlatformRuntime, identityBrowserSessionIdSchema, identityErrorResponseSchema, identityLoginResponseSchema, identityLoginSchema, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile } from "@codexsun/platform-core";\nimport { readConfig } from "./config.js";\nimport { ${name}FoundationProvider } from "./modules/foundation/provider.js";\n\nconst config = readConfig();\nconst identity = new LocalIdentityStore(config);\nawait identity.initialize();\nconst provider = new ${name}FoundationProvider();\nconst profile = readApplicationDeployableProfile({ applicationId: "${application.id}", availableProviderIds: ["platform.core", provider.manifest.id] });\nconst runtime = createPlatformRuntime(profile, [provider, ...(await loadEnabledAddonProviders(profile))]);\nruntime.start();\nconst app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();\napp.setValidatorCompiler(validatorCompiler);\napp.setSerializerCompiler(serializerCompiler);\nawait app.register(helmet);\nawait app.register(cors, { origin: process.env.${key}_WEB_ORIGIN, methods: ["GET", "HEAD", "OPTIONS", "POST"], allowedHeaders: ["Authorization", "Content-Type", "X-Codexsun-Browser-Session"] });\nawait app.register(swagger, { openapi: { info: { title: "${application.label} API", version: "1.0.0" }, openapi: "3.0.3" }, transform: jsonSchemaTransform });\nawait app.register(swaggerUi, { routePrefix: "/api/internal/reference", uiHooks: { onRequest: (request, reply, done) => { if (request.headers.authorization !== \`Bearer \${config.apiReferenceToken}\`) return reply.code(401).send({ error: "Authentication required." }); done(); } } });\napp.setErrorHandler((error, _request, reply) => { app.log.error(error); return reply.code(500).send({ error: "Internal server error.", code: "server.internal" }); });\napp.post("/api/v1/${application.id}/auth/login", { schema: { body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema } } }, async (request, reply) => {\n  const credentials = identityLoginSchema.safeParse(request.body);\n  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);\n  if (!credentials.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });\n  const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data);\n  return session ?? reply.code(401).send({ error: "Invalid login." });\n});\napp.post("/api/v1/${application.id}/auth/development-login", async (request, reply) => {\n  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);\n  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();\n  return (await identity.autoLogin(browserSessionId.data)) ?? reply.code(401).send({ error: "Development login is unavailable." });\n});\napp.addHook("onRequest", async (request, reply) => {\n  if (isPublicPath(request.url)) return;\n  if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) return reply.code(401).send({ error: "Authentication required." });\n});\napp.post("/api/v1/${application.id}/auth/logout", async (request, reply) => reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send());\napp.get("/api/v1/${application.id}/health", { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } }, async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }));\napp.addHook("onClose", () => { identity.close(); runtime.stop(); });\nawait app.listen({ host: config.host, port: config.port });\n\nfunction isPublicPath(url: string): boolean {\n  const path = new URL(url, "http://localhost").pathname;\n  return path === "/api/v1/${application.id}/auth/login"\n    || path === "/api/v1/${application.id}/auth/development-login"\n    || path === "/api/v1/${application.id}/health"\n    || path === "/api/internal/reference"\n    || path.startsWith("/api/internal/reference/");\n}\n`;
}

function apiSourceV5(application) {
  const name = className(application.id);
  const key = environmentKey(application.id);
  return `import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createPlatformRuntime, fastifyHelmetOptions, IdentityLoginRateLimitError, identityBrowserSessionIdSchema, identityErrorResponseSchema, identityLoginResponseSchema, identityLoginSchema, identityPasswordResetAcceptedSchema, identityPasswordResetConfirmationSchema, identityPasswordResetRequestSchema, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile, registerIdentityManagementRoutes } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { ${name}FoundationProvider } from "./modules/foundation/provider.js";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();
const provider = new ${name}FoundationProvider();
const profile = readApplicationDeployableProfile({ applicationId: "${application.id}", availableProviderIds: ["platform.core", provider.manifest.id] });
const runtime = createPlatformRuntime(profile, [provider, ...(await loadEnabledAddonProviders(profile))]);
runtime.start();
const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(helmet, fastifyHelmetOptions);
await app.register(cors, { origin: process.env.${key}_WEB_ORIGIN, methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"], allowedHeaders: ["Authorization", "Content-Type", "X-Codexsun-Browser-Session"] });
await app.register(swagger, { openapi: { info: { title: "${application.label} API", version: "1.0.0" }, openapi: "3.0.3" }, transform: jsonSchemaTransform });
await app.register(swaggerUi, { routePrefix: "/api/internal/reference", uiHooks: { onRequest: (request, reply, done) => { if (request.headers.authorization !== \`Bearer \${config.apiReferenceToken}\`) return reply.code(401).send({ error: "Authentication required." }); done(); } } });
app.setErrorHandler((error, _request, reply) => { app.log.error(error); return reply.code(500).send({ error: "Internal server error.", code: "server.internal" }); });
app.post("/api/v1/${application.id}/auth/login", { schema: { body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
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
app.post("/api/v1/${application.id}/auth/:portal/login", { schema: { params: z.object({ portal: z.enum(["admin", "super-admin"]) }), body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body);
  const portal = z.object({ portal: z.enum(["admin", "super-admin"]) }).safeParse(request.params);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !portal.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  try { const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, portal.data.portal); return session ?? reply.code(401).send({ error: "Invalid login." }); } catch (error) { if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." }); throw error; }
});
app.post("/api/v1/${application.id}/auth/password-reset/request", { schema: { body: identityPasswordResetRequestSchema, response: { 202: identityPasswordResetAcceptedSchema } } }, async (request, reply) => {
  const requestBody = identityPasswordResetRequestSchema.safeParse(request.body);
  const reset = requestBody.success ? await identity.requestPasswordReset(requestBody.data.identifier) : undefined;
  return reply.code(202).send({ message: "If the account exists, a reset request was created.", ...(config.exposeDevelopmentResetToken && reset ? { developmentToken: reset.token } : {}) });
});
app.post("/api/v1/${application.id}/auth/password-reset/confirm", { schema: { body: identityPasswordResetConfirmationSchema, response: { 204: z.null(), 400: identityErrorResponseSchema } } }, async (request, reply) => {
  const confirmation = identityPasswordResetConfirmationSchema.safeParse(request.body);
  if (!confirmation.success || !(await identity.resetPassword(confirmation.data.token, confirmation.data.password))) return reply.code(400).send({ error: "The reset token is invalid or expired." });
  return reply.code(204).send(null);
});
app.post("/api/v1/${application.id}/auth/development-login", async (request, reply) => {
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();
  return (await identity.autoLogin(browserSessionId.data)) ?? reply.code(401).send({ error: "Development login is unavailable." });
});
app.addHook("onRequest", async (request, reply) => {
  if (isPublicPath(request.url)) return;
  if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) return reply.code(401).send({ error: "Authentication required." });
});
app.post("/api/v1/${application.id}/auth/logout", async (request, reply) => reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send());
registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/${application.id}" });
app.get("/api/v1/${application.id}/health", { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } }, async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }));
app.addHook("onClose", () => { identity.close(); runtime.stop(); });
await app.listen({ host: config.host, port: config.port });

function isPublicPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return path === "/api/v1/${application.id}/auth/login"
    || path === "/api/v1/${application.id}/auth/admin/login"
    || path === "/api/v1/${application.id}/auth/super-admin/login"
    || path === "/api/v1/${application.id}/auth/development-login"
    || path === "/api/v1/${application.id}/auth/password-reset/request"
    || path === "/api/v1/${application.id}/auth/password-reset/confirm"
    || path === "/api/v1/${application.id}/health"
    || path === "/api/internal/reference"
    || path.startsWith("/api/internal/reference/");
}
`;
}

function viteSourceV2(application) {
  const [api, web] = application.hosts;
  const key = environmentKey(application.id);
  return `import { config } from "dotenv";\nimport { resolve } from "node:path";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\nimport { defineConfig } from "vite";\n\nconfig({ path: resolve(import.meta.dirname, "../../../.env") });\nconfig({ path: resolve(import.meta.dirname, ".app.env"), override: true });\n\nexport default defineConfig({\n  cacheDir: "../../../dist/.vite/apps/${application.id}/web",\n  plugins: [react(), tailwindcss()],\n  server: {\n    host: process.env.PLATFORM_HOST ?? "127.0.0.1",\n    port: Number(process.env.${web.envKey} ?? ${web.defaultPort}),\n    proxy: { "/api": process.env.VITE_${key}_API_URL ?? "http://127.0.0.1:${api.defaultPort}" },\n    strictPort: true,\n  },\n  build: { outDir: "../../../dist/apps/${application.id}/web", emptyOutDir: true },\n});\n`;
}

function agentSkillsSource(application) {
  return `# ${application.label} Agent Skills\n\nWork only inside apps/${application.id} unless a public platform or framework contract requires a reviewed change.\n\nKeep product modules owned by this application. Use shared UI, identity, and platform contracts instead of copying them.\n\nRun dependency installation from the repository root only. Do not create app-local node_modules, dist, or .turbo folders.\n\nVerify the affected API and web hosts. Run node tools/check-root-layout.mjs before completion.\n`;
}

function agentTaskSource(application) {
  return `# ${application.label} Task Guide\n\n1. Read apps/${application.id}/agent/skills.md.\n2. Keep changes inside apps/${application.id}.\n3. Use package public contracts for shared capabilities.\n4. Start hosts through root dev:${application.id}-api and dev:${application.id}-web commands.\n5. Run the application tests and node tools/check-root-layout.mjs.\n`;
}

function apiTestSource(application) {
  const name = className(application.id);
  return `import test from "node:test";\nimport assert from "node:assert/strict";\nimport { ${name}FoundationProvider } from "./modules/foundation/provider.js";\n\ntest("${application.id} API declares its owned health contract", () => {\n  const provider = new ${name}FoundationProvider();\n  assert.deepEqual(provider.manifest.contracts, ["${application.id}.health"]);\n  assert.equal(provider.manifest.owner, "apps/${application.id}/api/modules/foundation");\n});\n`;
}

function mariaDbTestSource(application) {
  return `import assert from "node:assert/strict";\nimport test from "node:test";\nimport { MigrationRunner, createMariaDbDataProvider } from "@codexsun/platform-core";\n\nconst connectionUrl = process.env.${environmentKey(application.id)}_MARIADB_INTEGRATION_URL;\n\ntest("runs ${application.id} migrations against an explicit MariaDB test database", { skip: !connectionUrl }, async () => {\n  assert.match(new URL(connectionUrl!).pathname, /test/i);\n  const provider = createMariaDbDataProvider({ connectionUrl: connectionUrl! });\n  try {\n    const runner = new MigrationRunner(provider.queryDatabase());\n    await runner.run({ moduleId: "${application.id}.integration", migrations: [], seeders: [] });\n  } finally {\n    await provider.destroy();\n  }\n});\n`;
}

function providerTestSource(application) {
  return `import test from "node:test";\nimport assert from "node:assert/strict";\nimport { ${className(application.id)}FoundationProvider } from "../provider.js";\n\ntest("declares the ${application.id} provider contract", () => assert.equal(new ${className(application.id)}FoundationProvider().manifest.id, "${application.id}.foundation"));\n`;
}

function readPort(value, fallback) {
  const port = Number(value ?? fallback);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Port must be between 1 and 65535.");
  return port;
}

function environmentKey(id) {
  return id.replaceAll("-", "_").toUpperCase();
}

function className(id) {
  return id.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join("");
}

function titleCase(id) {
  return id.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}

function write(root, path, content) {
  const file = resolve(root, path);
  mkdirSync(resolve(file, ".."), { recursive: true });
  writeFileSync(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function registerWorkspaceLock(root, application) {
  const path = resolve(root, "package-lock.json");
  if (!existsSync(path)) return;
  const lock = JSON.parse(readFileSync(path, "utf8"));
  const version = workspaceVersion(root);
  const apiWorkspace = apiPackage(application, version);
  const webWorkspace = webPackage(application, version);
  const entries = [[`apps/${application.id}/api`, apiWorkspace], [`apps/${application.id}/web`, webWorkspace]];
  for (const [workspacePath, workspace] of entries) {
    lock.packages[workspacePath] = workspace;
    lock.packages[`node_modules/${workspace.name}`] = { resolved: workspacePath, link: true };
  }
  writeJson(path, lock);
}

function registerRootScripts(root, application) {
  const path = resolve(root, "package.json");
  if (!existsSync(path)) return;
  const packageJson = JSON.parse(readFileSync(path, "utf8"));
  const scripts = packageJson.scripts ?? {};
  for (const host of application.hosts) {
    scripts[`dev:${application.id}-${host.kind}`] ??= `node tools/preflight.mjs ${host.target} --restart`;
  }
  scripts[`test:${application.id}`] ??= application.hosts.map((host) => `npm run test --workspace ${host.workspace}`).join(" && ");
  packageJson.scripts = scripts;
  writeJson(path, packageJson);
}

function registerTurboOutputs(root, application) {
  const path = resolve(root, "turbo.json");
  if (!existsSync(path)) return;
  const turbo = JSON.parse(readFileSync(path, "utf8"));
  turbo.tasks ??= {};
  turbo.tasks[`@codexsun/${application.id}-api#build`] = { outputs: [`../../../dist/${application.id}/api/**`] };
  turbo.tasks[`@codexsun/${application.id}-web#build`] = { outputs: [`../../../dist/apps/${application.id}/web/**`] };
  writeJson(path, turbo);
}

function workspaceVersion(root) {
  const packagePath = resolve(root ?? process.cwd(), "package.json");
  if (!existsSync(packagePath)) throw new Error("Root package.json is required to scaffold an application.");
  return String(JSON.parse(readFileSync(packagePath, "utf8")).version);
}

function requireText(path) {
  return readFileSync(path, "utf8");
}
