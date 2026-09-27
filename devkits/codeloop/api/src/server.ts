import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { existsSync, statSync } from "node:fs";
import { normalize, resolve } from "node:path";
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { createPlatformRuntime, fastifyHelmetOptions, IdentityLoginRateLimitError, identityBrowserSessionIdSchema, identityErrorResponseSchema, identityLoginResponseSchema, identityLoginSchema, identityPasswordResetAcceptedSchema, identityPasswordResetConfirmationSchema, identityPasswordResetRequestSchema, loadEnabledAddonProviders, LocalIdentityStore, readApplicationDeployableProfile, registerIdentityManagementRoutes } from "@codexsun/platform-core";
import { readConfig } from "./config.js";
import { CodeloopFoundationProvider } from "./modules/foundation/provider.js";
import { verifyProviderConnection } from "./modules/foundation/provider-connection.js";
import { ProviderSettingsStore, type ProviderSettingsInput } from "./modules/foundation/provider-settings-store.js";
import { ConversationStore } from "./modules/foundation/conversation-store.js";
import { AgentRunStore } from "./modules/foundation/agent-run-store.js";
import { ProjectKnowledgeStore } from "./modules/foundation/project-knowledge-store.js";
import { ProjectStore } from "./modules/foundation/project-store.js";
import { runProviderChat, streamProviderChat } from "./modules/foundation/provider-runtime.js";
import { FilesystemTools } from "./modules/workspace/filesystem-tools.js";
import { registerFilesystemRoutes } from "./modules/workspace/routes.js";
import { CodeTools } from "./modules/workspace/code-tools.js";
import { CodeIntelligence } from "./modules/workspace/code-intelligence.js";
import { GitTools } from "./modules/git/git-tools.js";
import { registerGitRoutes } from "./modules/git/routes.js";
import { AgentToolRegistry } from "./modules/agent/tool-registry.js";
import { AgentTaskController, AgentTaskError } from "./modules/agent/agent-task-controller.js";
import { runAgentChat, type AgentPendingApproval } from "./modules/agent/agent-runtime.js";
import { TerminalTools } from "./modules/terminal/terminal-tools.js";
import { TestTools } from "./modules/test/test-tools.js";
import { ValidationTools } from "./modules/validation/validation-tools.js";
import { BrowserTools } from "./modules/browser/browser-tools.js";
import { ProcessTools } from "./modules/process/process-tools.js";
import { SandboxTools } from "./modules/sandbox/sandbox-tools.js";
import { DependencyTools } from "./modules/dependency/dependency-tools.js";
import { ProjectTools } from "./modules/project/project-tools.js";
import { MemoryTools } from "./modules/memory/memory-tools.js";
import { registerTerminalRoutes } from "./modules/terminal/routes.js";

const config = readConfig();
const identity = new LocalIdentityStore(config);
await identity.initialize();
const defaultProviderSettings: readonly ProviderSettingsInput[] = [
  { providerId: "anthropic", enabled: true, endpoint: "https://api.anthropic.com", model: "Claude 3.7 Sonnet" },
  { providerId: "codex", enabled: true, endpoint: "Local runtime", model: "Default" },
  { providerId: "openai", enabled: false, endpoint: "https://api.openai.com/v1", model: "gpt-5.6-sol" },
  { providerId: "gemini", enabled: false, endpoint: "https://generativelanguage.googleapis.com", model: "Gemini Pro" },
  { providerId: "openrouter", enabled: false, endpoint: "https://openrouter.ai/api/v1", model: "Auto" },
  { providerId: "ollama", enabled: false, endpoint: config.agentCrewApiUrl ?? "http://127.0.0.1:6411", model: "qwen3:4b", apiKey: config.agentCrewToken },
];
const providerSettings = new ProviderSettingsStore(config.runtimeDatabasePath, config.secret);
providerSettings.initialize(defaultProviderSettings);
const conversationStore = new ConversationStore(config.runtimeDatabasePath);
conversationStore.initialize();
const agentRunStore = new AgentRunStore(config.runtimeDatabasePath);
agentRunStore.initialize();
const agentRunControllers = new Map<string, AbortController>();
const knowledgeStore = new ProjectKnowledgeStore(config.runtimeDatabasePath);
knowledgeStore.initialize();
const projectStore = new ProjectStore(config.runtimeDatabasePath);
projectStore.initialize();
const filesystemTools = new FilesystemTools(config.workspaceRoot, config.sandboxMode);
const codeTools = new CodeTools(filesystemTools);
const codeIntelligence = new CodeIntelligence(filesystemTools);
const gitTools = new GitTools(config.workspaceRoot, config.sandboxMode === "read-write");
const terminalTools = new TerminalTools(config.workspaceRoot);
const testTools = new TestTools(terminalTools);
const validationTools = new ValidationTools(terminalTools);
const browserTools = new BrowserTools(config.workspaceRoot);
const processTools = new ProcessTools(terminalTools);
const sandboxTools = new SandboxTools(config.workspaceRoot);
const dependencyTools = new DependencyTools(config.workspaceRoot);
const projectTools = new ProjectTools(config.workspaceRoot);
const memoryTools = new MemoryTools(config.memoryTransport, config.memoryTransport === "json" ? config.memoryJsonPath : config.runtimeDatabasePath);
const taskController = new AgentTaskController(memoryTools, gitTools);
const agentTools = new AgentToolRegistry(filesystemTools, terminalTools, gitTools, codeTools, codeIntelligence, testTools, validationTools, browserTools, processTools, sandboxTools, dependencyTools, projectTools, memoryTools);
const projectAgentTools = new Map<string, { filesystem: FilesystemTools; registry: AgentToolRegistry; cleanup: () => void }>();
const provider = new CodeloopFoundationProvider();
const profile = readApplicationDeployableProfile({ applicationId: "codeloop", availableProviderIds: ["platform.core", provider.manifest.id] });
const runtime = createPlatformRuntime(profile, [provider, ...(await loadEnabledAddonProviders(profile))]);
runtime.start();
const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(helmet, fastifyHelmetOptions);
await app.register(cors, { origin: process.env.CODELOOP_WEB_ORIGIN, methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"], allowedHeaders: ["Authorization", "Content-Type", "X-Codexsun-Browser-Session", "X-Codexsun-Auto-Login-Desk"] });
await app.register(swagger, { openapi: { info: { title: "CodeLoop API", version: "1.0.0" }, openapi: "3.0.3" }, transform: jsonSchemaTransform });
await app.register(swaggerUi, { routePrefix: "/api/internal/reference", uiHooks: { onRequest: (request, reply, done) => { if (request.headers.authorization !== `Bearer ${config.apiReferenceToken}`) return reply.code(401).send({ error: "Authentication required." }); done(); } } });
app.setErrorHandler((error, _request, reply) => { app.log.error(error); return reply.code(500).send({ error: "Internal server error.", code: "server.internal" }); });
app.post("/api/v1/codeloop/auth/login", { schema: { body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
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
app.post("/api/v1/codeloop/auth/:portal/login", { schema: { params: z.object({ portal: z.enum(["admin", "super-admin"]) }), body: identityLoginSchema, response: { 200: identityLoginResponseSchema, 400: identityErrorResponseSchema, 401: identityErrorResponseSchema, 429: identityErrorResponseSchema } } }, async (request, reply) => {
  const credentials = identityLoginSchema.safeParse(request.body);
  const portal = z.object({ portal: z.enum(["admin", "super-admin"]) }).safeParse(request.params);
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!credentials.success || !portal.success || !browserSessionId.success) return reply.code(400).send({ error: "Invalid login request." });
  try { const session = await identity.login(credentials.data.identifier, credentials.data.password, browserSessionId.data, portal.data.portal); return session ?? reply.code(401).send({ error: "Invalid login." }); } catch (error) { if (error instanceof IdentityLoginRateLimitError) return reply.code(429).send({ error: "Too many sign-in attempts. Try again later." }); throw error; }
});
app.post("/api/v1/codeloop/auth/password-reset/request", { schema: { body: identityPasswordResetRequestSchema, response: { 202: identityPasswordResetAcceptedSchema } } }, async (request, reply) => {
  const requestBody = identityPasswordResetRequestSchema.safeParse(request.body);
  const reset = requestBody.success ? await identity.requestPasswordReset(requestBody.data.identifier) : undefined;
  return reply.code(202).send({ message: "If the account exists, a reset request was created.", ...(config.exposeDevelopmentResetToken && reset ? { developmentToken: reset.token } : {}) });
});
app.post("/api/v1/codeloop/auth/password-reset/confirm", { schema: { body: identityPasswordResetConfirmationSchema, response: { 204: z.null(), 400: identityErrorResponseSchema } } }, async (request, reply) => {
  const confirmation = identityPasswordResetConfirmationSchema.safeParse(request.body);
  if (!confirmation.success || !(await identity.resetPassword(confirmation.data.token, confirmation.data.password))) return reply.code(400).send({ error: "The reset token is invalid or expired." });
  return reply.code(204).send(null);
});
app.post("/api/v1/codeloop/auth/development-login", async (request, reply) => {
  const browserSessionId = identityBrowserSessionIdSchema.safeParse(request.headers["x-codexsun-browser-session"]);
  if (!config.autoLogin || !browserSessionId.success) return reply.code(404).send();
  return (await identity.autoLogin(browserSessionId.data, request.headers["x-codexsun-auto-login-desk"])) ?? reply.code(401).send({ error: "Development login is unavailable." });
});
app.addHook("onRequest", async (request, reply) => {
  if (isPublicPath(request.url)) return;
  if (!identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"])) return reply.code(401).send({ error: "Authentication required." });
});
app.post("/api/v1/codeloop/auth/logout", async (request, reply) => reply.code(identity.logout(request.headers.authorization, request.headers["x-codexsun-browser-session"]) ? 204 : 401).send());
registerIdentityManagementRoutes({ app, identity, prefix: "/api/v1/codeloop" });
app.get("/api/v1/codeloop/health", { schema: { response: { 200: z.object({ status: z.literal("ok"), providers: z.array(z.string()) }) }, tags: ["System"] } }, async () => ({ status: "ok" as const, providers: [...runtime.enabledProviderIds] }));
registerFilesystemRoutes(app, filesystemTools, codeTools, codeIntelligence);
registerGitRoutes(app, gitTools);
registerTerminalRoutes(app, terminalTools);
app.post("/api/v1/codeloop/tasks", { schema: { body: z.object({ id: z.string().min(1).max(120).optional(), title: z.string().min(1).max(200), prompt: z.string().min(1).max(24_000), maxAttempts: z.number().int().min(1).max(3).optional() }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  return { task: taskController.create(actor.id, request.body) };
});
app.get("/api/v1/codeloop/tasks/:taskId", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ taskId: z.string().min(1).max(120) }).parse(request.params);
  const task = taskController.get(actor.id, params.taskId);
  return task ? { task } : reply.code(404).send({ error: "Task not found." });
});
app.post("/api/v1/codeloop/tasks/:taskId/start", { schema: { body: z.object({ approved: z.literal(true) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ taskId: z.string().min(1).max(120) }).parse(request.params);
  return runTaskOperation(reply, () => taskController.start(actor.id, params.taskId));
});
app.post("/api/v1/codeloop/tasks/:taskId/run", { schema: { body: z.object({ providerIds: z.array(z.enum(["anthropic", "codex", "gemini", "ollama", "openai", "openrouter"])).min(1).max(6), approved: z.literal(true), approvedTools: z.array(z.string().max(100)).max(50).default([]), validation: z.object({ scope: z.string().max(1000).optional(), timeoutMs: z.number().int().min(1_000).max(120_000).optional(), commands: z.record(z.string().max(2_000)).optional() }).optional() }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ taskId: z.string().min(1).max(120) }).parse(request.params);
  const task = taskController.get(actor.id, params.taskId);
  if (!task) return reply.code(404).send({ error: "Task not found." });
  try {
    let current = task.status === "running" ? task : taskController.start(actor.id, task.id);
    const saved = providerSettings.getSecrets(actor.id, request.body.providerIds);
    const byId = new Map(saved.map((providerSettingsItem) => [providerSettingsItem.providerId, providerSettingsItem]));
    let responses: unknown[] = [];
    for (let attempt = current.attempt; attempt < current.maxAttempts; attempt += 1) {
      const prompt = current.validation?.errors?.length ? `${current.prompt}\n\nPrevious validation errors:\n${current.validation.errors.join("\n")}` : current.prompt;
      responses = await Promise.all(request.body.providerIds.map(async (providerId) => {
        const providerSettingsItem = byId.get(providerId);
        if (!providerSettingsItem) return { providerId, status: "error" as const, message: "Provider is not configured." };
        return runAgentChat(providerSettingsItem, [{ role: "user", content: prompt }], { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken }, agentTools, undefined, request.body.approvedTools, actor.id);
      }));
      const approvals = responses.flatMap((result) => (result && typeof result === "object" && "pendingApprovals" in result && Array.isArray(result.pendingApprovals)) ? result.pendingApprovals : []);
      if (approvals.length) {
        current = taskController.requestApproval(actor.id, task.id, "The agent requested approval before continuing.");
        return { task: current, responses };
      }
      const providerFailures = responses.filter((result) => !result || typeof result !== "object" || ("status" in result && result.status !== "completed"));
      if (providerFailures.length) {
        const failed = taskController.fail(actor.id, task.id, "Provider execution failed before validation.");
        current = taskController.rollback(actor.id, failed.id);
        return { task: current, responses };
      }
      const validation = await taskController.validateAndTransition(actor.id, task.id, () => validationTools.validate(request.body.validation?.scope, request.body.validation?.commands, request.body.validation?.timeoutMs));
      current = validation.task;
      if (current.status !== "retrying") return { task: current, validation: validation.validation, responses };
      current = taskController.start(actor.id, task.id);
    }
    return { task: current, responses };
  } catch (error) { if (error instanceof AgentTaskError) return reply.code(error.statusCode).send({ error: error.message, code: "agent.task" }); throw error; }
});
app.post("/api/v1/codeloop/tasks/:taskId/approval", { schema: { body: z.object({ reason: z.string().min(1).max(500) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ taskId: z.string().min(1).max(120) }).parse(request.params);
  return runTaskOperation(reply, () => taskController.requestApproval(actor.id, params.taskId, request.body.reason));
});
app.post("/api/v1/codeloop/tasks/:taskId/validate", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ taskId: z.string().min(1).max(120) }).parse(request.params);
  return runTaskOperation(reply, () => taskController.beginValidation(actor.id, params.taskId));
});
app.post("/api/v1/codeloop/tasks/:taskId/validation-result", { schema: { body: z.object({ success: z.boolean(), stages: z.record(z.string()).optional(), errors: z.array(z.string().max(2_000)).max(50).optional() }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ taskId: z.string().min(1).max(120) }).parse(request.params);
  return runTaskOperation(reply, () => taskController.recordValidation(actor.id, params.taskId, request.body));
});
app.post("/api/v1/codeloop/tasks/:taskId/rollback", { schema: { body: z.object({ approved: z.literal(true) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ taskId: z.string().min(1).max(120) }).parse(request.params);
  return runTaskOperation(reply, () => taskController.rollback(actor.id, params.taskId));
});
app.get("/api/v1/codeloop/providers", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  return { providers: providerSettings.list(actor.id) };
});
app.put("/api/v1/codeloop/providers", { schema: { body: z.object({ providers: z.array(z.object({ apiKey: z.string().optional(), enabled: z.boolean(), endpoint: z.string().min(1), model: z.string().min(1), providerId: z.enum(["anthropic", "codex", "gemini", "ollama", "openai", "openrouter"]) })) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  return { providers: providerSettings.replace(actor.id, request.body.providers) };
});
app.get("/api/v1/codeloop/providers/live-status", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const configured = providerSettings.list(actor.id).filter((provider) => provider.enabled);
  const secrets = new Map(providerSettings.getSecrets(actor.id, configured.map((provider) => provider.providerId)).map((provider) => [provider.providerId, provider]));
  const results = await Promise.all(configured.map(async (provider) => {
    const startedAt = Date.now();
    const result = await verifyProviderConnection(secrets.get(provider.providerId) ?? provider, { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken }, AbortSignal.timeout(3_000));
    return { providerId: provider.providerId, result, latencyMs: Date.now() - startedAt };
  }));
  return { checkedAt: new Date().toISOString(), results };
});
app.get("/api/v1/codeloop/conversations", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const query = z.object({ projectId: z.string().optional() }).parse(request.query);
  return { conversations: conversationStore.listConversations(actor.id, query.projectId) };
});
app.get("/api/v1/codeloop/projects", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const defaultProject = projectStore.ensureDefault(actor.id, {
    id: "codexsun",
    name: "codexsun",
    path: config.workspaceRoot,
    sourceType: "local",
    repository: "CODEXSUN/codexsun",
    description: "Autonomous code workflow orchestrator and developer tooling for CODEXSUN.",
    instructions: "You are an AI coding assistant operating within the codexsun project context. Follow the repository rules and keep all operations inside the configured workspace.",
  });
  const projects = projectStore.list(actor.id).map((project) => ({ ...project, knowledgeFiles: knowledgeStore.list(actor.id, project.id) }));
  return { projects: projects.length ? projects : [{ ...defaultProject, knowledgeFiles: knowledgeStore.list(actor.id, defaultProject.id) }] };
});
app.post("/api/v1/codeloop/projects", { schema: { body: z.object({ id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,62}$/u).optional(), name: z.string().min(2).max(120), sourceType: z.enum(["local", "cloud"]), path: z.string().max(1000).optional(), repository: z.string().url().optional(), description: z.string().max(500).optional(), instructions: z.string().max(4_000).optional() }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const input = request.body;
  const id = input.id ?? input.name.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 63);
  const sourcePath = input.sourceType === "local" ? input.path?.trim() : undefined;
  if (input.sourceType === "local" && (!sourcePath || !existsSync(sourcePath) || !statSync(sourcePath).isDirectory())) return reply.code(400).send({ error: "Choose an existing local repository directory." });
  if (input.sourceType === "cloud" && !input.repository) return reply.code(400).send({ error: "Enter a cloud repository URL." });
  try {
    const project = projectStore.create(actor.id, { id, name: input.name.trim(), path: sourcePath ?? "", sourceType: input.sourceType, repository: input.repository, description: input.description?.trim() || `${input.name.trim()} project`, instructions: input.instructions?.trim() || `You are an AI coding assistant operating in the ${input.name.trim()} project.` });
    return reply.code(201).send({ project: { ...project, knowledgeFiles: [] } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) return reply.code(409).send({ error: "A project with this ID already exists." });
    throw error;
  }
});
app.get("/api/v1/codeloop/projects/:projectId/knowledge", async (request, reply) => { const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]); if (!actor) return reply.code(401).send({ error: "Authentication required." }); const params = z.object({ projectId: z.string().min(1) }).parse(request.params); return { files: knowledgeStore.list(actor.id, params.projectId) }; });
app.put("/api/v1/codeloop/projects/:projectId/knowledge", { schema: { body: z.object({ files: z.array(z.object({ name: z.string().min(1).max(200), path: z.string().min(1).max(1000), size: z.string().max(50), description: z.string().max(500) })).max(200) }) } }, async (request, reply) => { const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]); if (!actor) return reply.code(401).send({ error: "Authentication required." }); const params = z.object({ projectId: z.string().min(1) }).parse(request.params); return { files: knowledgeStore.replace(actor.id, params.projectId, request.body.files) }; });

app.post("/api/v1/codeloop/conversations", { schema: { body: z.object({ id: z.string().optional(), projectId: z.string().min(1), title: z.string().optional() }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const conversation = conversationStore.createConversation(actor.id, request.body);
  return { conversation };
});

app.get("/api/v1/codeloop/conversations/:conversationId", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1) }).parse(request.params);
  const conversation = conversationStore.getConversation(actor.id, params.conversationId);
  if (!conversation) return reply.code(404).send({ error: "Conversation not found." });
  return { conversation };
});

app.patch("/api/v1/codeloop/conversations/:conversationId", { schema: { body: z.object({ title: z.string().optional(), status: z.enum(["idle", "running", "completed"]).optional() }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1) }).parse(request.params);
  const updated = conversationStore.updateConversation(actor.id, params.conversationId, request.body);
  if (!updated) return reply.code(404).send({ error: "Conversation not found." });
  return { conversation: updated };
});

app.delete("/api/v1/codeloop/conversations/:conversationId", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1) }).parse(request.params);
  conversationStore.deleteConversation(actor.id, params.conversationId);
  return reply.code(204).send();
});

app.get("/api/v1/codeloop/conversations/:conversationId/providers", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1) }).parse(request.params);
  return { providers: providerSettings.listBindings(actor.id, params.conversationId) };
});
app.put("/api/v1/codeloop/conversations/:conversationId/providers", { schema: { body: z.object({ providers: z.array(z.object({ model: z.string().min(1), providerId: z.enum(["anthropic", "codex", "gemini", "ollama", "openai", "openrouter"]) })) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1) }).parse(request.params);
  return { providers: providerSettings.replaceBindings(actor.id, params.conversationId, request.body.providers) };
});
app.get("/api/v1/codeloop/conversations/:conversationId/runs/active", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1) }).parse(request.params);
  return { run: agentRunStore.active(actor.id, params.conversationId) };
});
app.get("/api/v1/codeloop/conversations/:conversationId/runs/:runId/events", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1), runId: z.string().min(1) }).parse(request.params);
  const query = z.object({ after: z.coerce.number().int().min(0).default(0) }).parse(request.query);
  const run = agentRunStore.get(actor.id, params.runId, query.after);
  if (!run || run.conversationId !== params.conversationId) return reply.code(404).send({ error: "Agent run not found." });
  return { run };
});
app.post("/api/v1/codeloop/conversations/:conversationId/runs/:runId/cancel", async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1), runId: z.string().min(1) }).parse(request.params);
  const run = agentRunStore.get(actor.id, params.runId);
  if (!run || run.conversationId !== params.conversationId) return reply.code(404).send({ error: "Agent run not found." });
  agentRunControllers.get(params.runId)?.abort(new Error("Run cancelled by the user."));
  agentRunStore.append(params.runId, "run_cancel_requested", { message: "Run cancelled by the user." });
  return { run: agentRunStore.get(actor.id, params.runId) };
});
app.post("/api/v1/codeloop/conversations/:conversationId/messages", { schema: { body: z.object({ messages: z.array(z.object({ content: z.string().min(1).max(24000), role: z.enum(["assistant", "user"]) })).min(1).max(40), projectContext: z.string().max(12000).optional(), knowledgePaths: z.array(z.string().max(1000)).max(200).default([]), providerIds: z.array(z.enum(["anthropic", "codex", "gemini", "ollama", "openai", "openrouter"])).min(1).max(6), agentic: z.boolean().default(true), approvedTools: z.array(z.string().max(100)).max(50).default([]), persistUser: z.boolean().default(true), stream: z.boolean().default(false) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const params = z.object({ conversationId: z.string().min(1) }).parse(request.params);

  // Ensure conversation exists in DB
  let conv = conversationStore.getConversation(actor.id, params.conversationId);
  if (!conv) {
    conversationStore.createConversation(actor.id, { id: params.conversationId, projectId: "codexsun" });
    conv = conversationStore.getConversation(actor.id, params.conversationId);
  }
  const project = conv ? projectStore.get(actor.id, conv.projectId) : null;
  if (!project) return reply.code(404).send({ error: "Project not found for this conversation." });
  if (project.sourceType === "cloud") return reply.code(409).send({ error: "This cloud project is registered but not synchronized. Sync the repository into a sandbox before chatting." });
  const projectRuntime = getProjectRuntime(project.path);

  // Persist the incoming latest user message
  const userMessages = request.body.messages.filter((m) => m.role === "user");
  const latestUser = userMessages[userMessages.length - 1];
  if (request.body.persistUser && latestUser) {
    conversationStore.addMessage(params.conversationId, {
      role: "user",
      content: latestUser.content,
    });

    if (conv && (conv.title === "New conversation" || conv.title === "New chat")) {
      const autoTitle = latestUser.content.slice(0, 32).trim() + (latestUser.content.length > 32 ? "…" : "");
      conversationStore.updateConversation(actor.id, params.conversationId, { title: autoTitle, status: "running" });
    } else {
      conversationStore.updateConversation(actor.id, params.conversationId, { status: "running" });
    }
  }

  const bindings = providerSettings.listBindings(actor.id, params.conversationId);
  const requestedIds = request.body.providerIds.length ? request.body.providerIds : bindings.map((binding) => binding.providerId);
  const saved = providerSettings.getSecrets(actor.id, requestedIds);
  const byId = new Map(saved.map((provider) => [provider.providerId, provider]));
  const knowledgeReadLimit = request.body.agentic ? 2000 : 6000;
  const knowledgeContext = (await Promise.all(request.body.knowledgePaths.map(async (path) => { const file = await projectRuntime.filesystem.read(path, knowledgeReadLimit).catch(() => undefined); return file ? `\n[${path}]\n${file.content}` : ""; }))).filter(Boolean).join("\n").slice(0, request.body.agentic ? 8000 : 24000);
  const context = [request.body.projectContext, knowledgeContext ? `Project knowledge (reference only):${knowledgeContext}` : ""].filter(Boolean).join("\n");
  const messages = context ? [{ role: "system" as const, content: context }, ...request.body.messages] : request.body.messages;
  if (request.body.stream) {
    reply.raw.writeHead(200, { "cache-control": "no-cache", connection: "keep-alive", "content-type": "text/event-stream" });
    const responses: Awaited<ReturnType<typeof runProviderChat>>[] = [];
    const run = agentRunStore.create(actor.id, params.conversationId);
    const requestAbort = new AbortController();
    agentRunControllers.set(run.id, requestAbort);
    const emit = (event: Record<string, unknown>) => {
      const stored = agentRunStore.append(run.id, String(event.type ?? "event"), event);
      if (!reply.raw.destroyed) reply.raw.write(`data: ${JSON.stringify({ ...event, runId: run.id, seq: stored.seq })}\n\n`);
    };
    emit({ type: "run_started", runId: run.id });
    await Promise.all(requestedIds.map(async (providerId) => {
      const provider = byId.get(providerId);
      if (!provider) {
        responses.push({ message: `${providerId} is not configured for this workspace.`, model: "", providerId, status: "error" });
        emit({ type: "error", providerId, message: `${providerId} is not configured for this workspace.` });
        return;
      }
      emit({ type: "provider", providerId, model: provider.model });
      emit({ type: "activity", providerId, phase: "working", status: "active", message: "Working" });
      const startedAt = Date.now();
      const heartbeat = setInterval(() => emit({ type: "activity", providerId, phase: "working", status: "active", message: `Working for ${Math.floor((Date.now() - startedAt) / 1000)}s` }), 1000);
      try {
        const result = request.body.agentic && shouldUseAgentRuntime(messages) && ["anthropic", "ollama", "openai", "openrouter"].includes(providerId)
        ? await runAgentChat(provider, messages, { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken }, projectRuntime.registry, requestAbort.signal, request.body.approvedTools, actor.id, (event) => {
          const phase = event.type === "thinking" ? (event.step === 0 ? "thinking" : "reasoning") : event.type === "approval_required" ? "waiting" : event.type === "tool_start" ? (event.tool.startsWith("terminal.") || event.tool.startsWith("process.") || event.tool.startsWith("test.") ? "command" : "running") : "running";
          emit({ type: "activity", providerId, phase, status: event.type === "tool_complete" ? (event.status === "failed" ? "error" : "complete") : "active", message: event.type === "thinking" ? event.message : event.type === "tool_start" ? `Running ${event.tool}` : event.type === "tool_complete" ? `${event.tool} completed` : "Waiting for approval", tool: "tool" in event ? event.tool : undefined, callId: "callId" in event ? event.callId : undefined, durationMs: "durationMs" in event ? event.durationMs : undefined });
        })
        : await streamProviderChat(provider, messages, { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken }, (event) => {
          emit({ ...event, providerId });
          if (event.type === "thinking") emit({ type: "activity", providerId, phase: "thinking", status: "active", message: "Thinking" });
          if (event.type === "token") emit({ type: "activity", providerId, phase: "working", status: "active", message: "Writing response" });
        }, requestAbort.signal);
        responses.push(result);
        const pendingApprovals = pendingApprovalsOf(result);
        if (pendingApprovals.length) emit({ type: "approval_required", providerId, pending: pendingApprovals });
        if (result.status === "error") emit({ type: "error", providerId, message: result.message });
        else if (request.body.agentic) emit({ type: "token", providerId, content: result.content ?? "" });
        emit({ type: "activity", providerId, phase: result.status === "completed" ? "completed" : "error", status: result.status === "completed" ? "complete" : "error", message: result.message });
        emit({ type: "provider-done", providerId, status: result.status, message: result.message });
      } finally {
        clearInterval(heartbeat);
      }
    }));
    for (const res of responses) {
      conversationStore.addMessage(params.conversationId, {
        id: `msg-${Date.now()}-${res.providerId}`,
        role: res.status === "completed" ? "assistant" : "error",
        content: res.status === "completed" ? (res.content ?? "") : `${res.providerId}: ${res.message}`,
        trace: [{ type: res.status === "completed" ? "complete" : "error", message: res.message }, ...pendingApprovalsOf(res).map((approval) => ({ type: "tool.approval_required", message: `${approval.tool} requires approval`, data: approval })), ...(("toolEvents" in res && Array.isArray(res.toolEvents)) ? res.toolEvents.map((event) => ({ type: `tool.${event.status}`, message: `${event.tool} (${event.durationMs}ms)` })) : [])],
      });
    }
    const finalStatus = requestAbort.signal.aborted ? "cancelled" : responses.some((response) => response.status === "error") ? "failed" : "completed";
    agentRunStore.finish(run.id, finalStatus);
    conversationStore.updateConversation(actor.id, params.conversationId, { status: "completed" });
    const updatedDetail = conversationStore.getConversation(actor.id, params.conversationId);
    emit({ type: "complete", status: finalStatus, responses, messages: updatedDetail?.messages });
    agentRunControllers.delete(run.id);
    reply.raw.end();
    return reply;
  }
  const responses = await Promise.all(requestedIds.map(async (providerId) => {
    const provider = byId.get(providerId);
    if (!provider) return { message: `${providerId} is not configured for this workspace.`, model: "", providerId, status: "error" as const };
    if (request.body.agentic && ["anthropic", "ollama", "openai", "openrouter"].includes(providerId))
      return runAgentChat(provider, messages, { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken }, projectRuntime.registry, undefined, request.body.approvedTools, actor.id);
    return runProviderChat(provider, messages, { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken });
  }));

  // Persist each response to SQLite
  for (const res of responses) {
    conversationStore.addMessage(params.conversationId, {
      id: `msg-${Date.now()}-${res.providerId}`,
      role: res.status === "completed" ? "assistant" : "error",
      content: res.status === "completed" ? (res.content ?? "") : `${res.providerId}: ${res.message}`,
      trace: [{ type: res.status === "completed" ? "complete" : "error", message: res.message }, ...pendingApprovalsOf(res).map((approval) => ({ type: "tool.approval_required", message: `${approval.tool} requires approval`, data: approval })), ...(("toolEvents" in res && Array.isArray(res.toolEvents)) ? res.toolEvents.map((event) => ({ type: `tool.${event.status}`, message: `${event.tool} (${event.durationMs}ms)` })) : [])],
    });
  }

  conversationStore.updateConversation(actor.id, params.conversationId, { status: "completed" });
  const updatedDetail = conversationStore.getConversation(actor.id, params.conversationId);

  return { conversationId: params.conversationId, responses, messages: updatedDetail?.messages };
});
app.post("/api/v1/codeloop/providers/verify-many", { schema: { body: z.object({ providers: z.array(z.object({ endpoint: z.string().min(1), model: z.string().optional(), providerId: z.enum(["anthropic", "codex", "gemini", "ollama", "openai", "openrouter"]) })).min(1) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const saved = providerSettings.getSecrets(actor.id, request.body.providers.map((provider) => provider.providerId));
  const byId = new Map(saved.map((provider) => [provider.providerId, provider]));
  const results = await Promise.all(request.body.providers.map(async (provider) => ({ providerId: provider.providerId, result: await verifyProviderConnection({ apiKey: byId.get(provider.providerId)?.apiKey, endpoint: provider.endpoint, model: provider.model, providerId: provider.providerId }, { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken }) })));
  return { results };
});
app.post("/api/v1/codeloop/providers/verify", { schema: { body: z.object({ apiKey: z.string().optional(), endpoint: z.string().min(1), model: z.string().optional(), providerId: z.enum(["anthropic", "codex", "gemini", "ollama", "openai", "openrouter"]) }) } }, async (request, reply) => {
  const result = await verifyProviderConnection(request.body, { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken });
  return reply.header("content-type", "application/json; charset=utf-8").send(JSON.stringify(result));
});
app.post("/api/v1/codeloop/providers/smoke-test", { schema: { body: z.object({ endpoint: z.string().min(1), model: z.string().min(1), providerId: z.enum(["anthropic", "codex", "gemini", "ollama", "openai", "openrouter"]) }) } }, async (request, reply) => {
  const actor = identity.authenticate(request.headers.authorization, request.headers["x-codexsun-browser-session"]);
  if (!actor) return reply.code(401).send({ error: "Authentication required." });
  const saved = providerSettings.getSecrets(actor.id, [request.body.providerId]);
  const configured = saved[0];
  if (!configured) return reply.code(404).send({ error: `${request.body.providerId} is not configured.` });
  const provider: ProviderSettingsInput = {
    ...configured,
    endpoint: request.body.endpoint.trim(),
    model: request.body.model.trim(),
  };
  const startedAt = Date.now();
  const timeout = AbortSignal.timeout(15_000);
  const result = await runProviderChat(provider, [{ content: "Reply with exactly: CodeLoop smoke test passed.", role: "user" }], { agentCrewApiUrl: config.agentCrewApiUrl, agentCrewToken: config.agentCrewToken }, timeout);
  const response = result.status === "completed" ? userFacingSmokeResponse(result.content) : undefined;
  return {
    latencyMs: Date.now() - startedAt,
    message: timeout.aborted && result.status !== "completed" ? `${provider.providerId} smoke test timed out after 15 seconds.` : result.message,
    model: result.model,
    response,
    status: result.status === "completed" ? "connected" : "error",
  };
});
app.addHook("onClose", async () => { await browserTools.close(); sandboxTools.cleanup(); terminalTools.cleanup(); for (const runtime of projectAgentTools.values()) runtime.cleanup(); conversationStore.close(); knowledgeStore.close(); providerSettings.close(); memoryTools.close(); identity.close(); runtime.stop(); });
await app.listen({ host: config.host, port: config.port });

function runTaskOperation(reply: import("fastify").FastifyReply, operation: () => unknown): unknown {
  try { return { task: operation() }; }
  catch (error) { if (error instanceof AgentTaskError) return reply.code(error.statusCode).send({ error: error.message, code: "agent.task" }); throw error; }
}

function shouldUseAgentRuntime(messages: readonly { role: string; content: string }[]): boolean {
  const prompt = messages.filter((message) => message.role === "user").map((message) => message.content).join(" ").toLowerCase();
  return /\b(fs\.|code\.|project\.|test\.|validate|terminal|process|sandbox|docker|git|package|browser|memory|create|write|edit|fix|implement|build|run|inspect|file|component|site|app)\b/u.test(prompt);
}

function pendingApprovalsOf(value: unknown): AgentPendingApproval[] {
  if (!value || typeof value !== "object") return [];
  const pending = (value as { pendingApprovals?: unknown }).pendingApprovals;
  return Array.isArray(pending) ? pending as AgentPendingApproval[] : [];
}

function userFacingSmokeResponse(content: string | undefined): string | undefined {
  if (!content) return undefined;
  const thinkEnd = content.toLowerCase().lastIndexOf("</think>");
  return (thinkEnd >= 0 ? content.slice(thinkEnd + "</think>".length) : content).trim() || undefined;
}

function getProjectRuntime(projectPath: string): { filesystem: FilesystemTools; registry: AgentToolRegistry; cleanup: () => void } {
  const root = normalize(resolve(projectPath));
  const cached = projectAgentTools.get(root);
  if (cached) return cached;
  const projectFilesystem = new FilesystemTools(root, config.sandboxMode);
  const projectCode = new CodeTools(projectFilesystem);
  const projectIntelligence = new CodeIntelligence(projectFilesystem);
  const projectGit = new GitTools(root, config.sandboxMode === "read-write");
  const projectTerminal = new TerminalTools(root);
  const projectTests = new TestTools(projectTerminal);
  const projectValidation = new ValidationTools(projectTerminal);
  const projectBrowser = new BrowserTools(root);
  const projectProcesses = new ProcessTools(projectTerminal);
  const projectSandbox = new SandboxTools(root);
  const projectDependencies = new DependencyTools(root);
  const projectProject = new ProjectTools(root);
  const registry = new AgentToolRegistry(projectFilesystem, projectTerminal, projectGit, projectCode, projectIntelligence, projectTests, projectValidation, projectBrowser, projectProcesses, projectSandbox, projectDependencies, projectProject, memoryTools);
  const cleanup = () => { projectTerminal.cleanup(); projectSandbox.cleanup(); void projectBrowser.close(); };
  projectAgentTools.set(root, { filesystem: projectFilesystem, registry, cleanup });
  return { filesystem: projectFilesystem, registry, cleanup };
}


function isPublicPath(url: string): boolean {
  const path = new URL(url, "http://localhost").pathname;
  return path === "/api/v1/codeloop/auth/login"
    || path === "/api/v1/codeloop/auth/admin/login"
    || path === "/api/v1/codeloop/auth/super-admin/login"
    || path === "/api/v1/codeloop/auth/development-login"
    || path === "/api/v1/codeloop/auth/password-reset/request"
    || path === "/api/v1/codeloop/auth/password-reset/confirm"
    || path === "/api/v1/codeloop/health"
    || path === "/api/internal/reference"
    || path.startsWith("/api/internal/reference/");
}
