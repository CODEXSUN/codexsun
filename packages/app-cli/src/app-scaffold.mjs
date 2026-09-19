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
  write(root, `apps/${application.id}/README.md`, `# ${application.label}\n\nThis application owns its product modules and composition.\n`);
  write(root, `apps/${application.id}/api/package.json`, apiPackage(application, version));
  write(root, `apps/${application.id}/api/tsconfig.json`, '{ "extends": "../../../tsconfig.base.json", "include": ["src", "test"] }\n');
  write(root, `apps/${application.id}/api/.app.env.example`, `PLATFORM_HOST=127.0.0.1\n${api.envKey}=${api.defaultPort}\n${key}_WEB_ORIGIN=http://127.0.0.1:${web.defaultPort}\n${key}_API_REFERENCE_TOKEN=change-this-local-token\n`);
  write(root, `apps/${application.id}/api/README.md`, `# ${application.label} API\n\nThe API exposes typed Zod routes and a protected internal OpenAPI reference.\n`);
  write(root, `apps/${application.id}/api/src/config.ts`, apiConfigSource(application));
  write(root, `apps/${application.id}/api/src/server.ts`, apiSourceV3(application));
  write(root, `apps/${application.id}/api/src/server.test.ts`, apiTestSource(application));
  write(root, `apps/${application.id}/api/src/mariadb.integration.test.ts`, mariaDbTestSource(application));
  write(root, `apps/${application.id}/api/src/modules/foundation/provider.ts`, providerSource(application));
  write(root, `apps/${application.id}/api/src/modules/foundation/README.md`, `# ${application.label} Foundation Module\n\nThis module owns the application health provider.\n`);
  write(root, `apps/${application.id}/api/src/modules/foundation/test/provider.test.ts`, providerTestSource(application));
  write(root, `apps/${application.id}/web/package.json`, webPackage(application, version));
  write(root, `apps/${application.id}/web/tsconfig.json`, '{ "extends": "../../../tsconfig.base.json", "compilerOptions": { "module": "ESNext", "moduleResolution": "Bundler", "jsx": "react-jsx", "noEmit": true, "types": ["vite/client"] }, "include": ["src", "vite.config.ts"] }\n');
  write(root, `apps/${application.id}/web/.app.env.example`, `PLATFORM_HOST=127.0.0.1\n${web.envKey}=${web.defaultPort}\nVITE_${key}_API_URL=http://127.0.0.1:${api.defaultPort}\n`);
  write(root, `apps/${application.id}/web/README.md`, `# ${application.label} Web\n\nThe web host composes the shared MDI workspace.\n`);
  write(root, `apps/${application.id}/web/index.html`, '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n');
  write(root, `apps/${application.id}/web/src/main.tsx`, 'import "@codexsun/ui/globals.css";\nimport { QueryClient, QueryClientProvider } from "@tanstack/react-query";\nimport { createRoot } from "react-dom/client";\nimport { App } from "./app";\n\nconst queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 15_000, refetchOnWindowFocus: false } } });\ncreateRoot(document.getElementById("root")!).render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);\n');
  write(root, `apps/${application.id}/web/src/app.tsx`, `import { useQuery } from "@tanstack/react-query";\nimport { MainWorkspace } from "@codexsun/ui";\n\ntype Health = { status: "ok"; providers: string[] };\n\nexport function App() {\n  const health = useQuery({ queryKey: ["${application.id}", "health"], queryFn: readHealth });\n  return <MainWorkspace applicationId="${application.id}" applicationName="${application.label}" workspaceTitle="${application.label}"><main className="p-6"><h1 className="text-lg font-semibold">${application.label}</h1><p className="text-sm text-muted-foreground">{health.isPending ? "Connecting to API…" : health.isError ? "API connection failed." : \`API ready: \${health.data.status}\`}</p></main></MainWorkspace>;\n}\n\nasync function readHealth(): Promise<Health> {\n  const response = await fetch("/api/v1/${application.id}/health", { signal: AbortSignal.timeout(5_000) });\n  if (!response.ok) throw new Error(\`Health request failed: \${response.status}\`);\n  return response.json() as Promise<Health>;\n}\n`);
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
  return { name: `@codexsun/${application.id}-api`, version, private: true, type: "module", scripts: { build: "esbuild src/server.ts --bundle --platform=node --format=esm --outfile=../../../dist/" + application.id + "/api/server.js", check: "tsc -p tsconfig.json --noEmit", dev: "tsx watch src/server.ts", lint: "eslint src", test: "tsx --test src/server.test.ts src/mariadb.integration.test.ts src/modules/foundation/test/provider.test.ts" }, dependencies: { "@codexsun/framework": "file:../../../packages/framework", "@codexsun/platform-core": "file:../../../packages/platform-core", "@fastify/cors": "^11.3.0", "@fastify/helmet": "^13.1.1", "@fastify/swagger": "^9.8.1", "@fastify/swagger-ui": "^6.1.1", fastify: "^5.0.0", "fastify-type-provider-zod": "^4.0.2", zod: "^3.25.76" } };
}

function webPackage(application, version) {
  return { name: `@codexsun/${application.id}-web`, version, private: true, type: "module", scripts: { build: "vite build", check: "tsc -p tsconfig.json --noEmit", dev: "vite", lint: "eslint src", test: "tsx --test" }, dependencies: { "@codexsun/ui": "file:../../../packages/ui", "@tailwindcss/vite": "^4.0.0", "@tanstack/react-query": "^5.103.1", "@vitejs/plugin-react": "^5.0.0", react: "^19.0.0", "react-dom": "^19.0.0", vite: "^7.0.0" } };
}

function providerSource(application) {
  const name = className(application.id);
  return `import type { ModuleProvider } from "@codexsun/framework";\n\nexport class ${name}FoundationProvider implements ModuleProvider {\n  readonly manifest = { id: "${application.id}.foundation", owner: "apps/${application.id}/api/modules/foundation", version: "1.0.0", dependencies: ["platform.core"], contracts: ["${application.id}.health"], events: { published: [], consumed: [] } };\n  register(): void {}\n}\n`;
}

function apiConfigSource(application) {
  const [api] = application.hosts;
  const key = environmentKey(application.id);
  return `import { config } from "dotenv";\nimport { resolve } from "node:path";\n\nexport function readConfig() {\n  config({ path: resolve(process.cwd(), "../../../.env") });\n  config({ path: resolve(process.cwd(), ".app.env"), override: true });\n  const port = Number(process.env.${api.envKey});\n  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("Set ${api.envKey} to a valid port.");\n  const host = process.env.PLATFORM_HOST;\n  if (!host) throw new Error("Set PLATFORM_HOST.");\n  const apiReferenceToken = process.env.${key}_API_REFERENCE_TOKEN;\n  if (!apiReferenceToken) throw new Error("Set ${key}_API_REFERENCE_TOKEN.");\n  return { apiReferenceToken, host, port };\n}\n`;
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

function viteSourceV2(application) {
  const [api, web] = application.hosts;
  const key = environmentKey(application.id);
  return `import { config } from "dotenv";\nimport { resolve } from "node:path";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\nimport { defineConfig } from "vite";\n\nconfig({ path: resolve(import.meta.dirname, "../../../.env") });\nconfig({ path: resolve(import.meta.dirname, ".app.env"), override: true });\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: {\n    host: process.env.PLATFORM_HOST ?? "127.0.0.1",\n    port: Number(process.env.${web.envKey} ?? ${web.defaultPort}),\n    proxy: { "/api": process.env.VITE_${key}_API_URL ?? "http://127.0.0.1:${api.defaultPort}" },\n    strictPort: true,\n  },\n  build: { outDir: "../../../dist/apps/${application.id}/web", emptyOutDir: true },\n});\n`;
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
