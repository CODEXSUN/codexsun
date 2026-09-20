import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { GitProvider } from "./github-provider.js";
import { CxforgeRuntimeManager } from "./runtime-manager.js";

const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  appName: z.string(),
  prompt: z.string(),
  repository: z.string(),
  ownedPaths: z.array(z.string()),
  status: z.enum(["draft", "queued", "running", "review", "approved", "rejected", "blocked", "failed", "merged"]),
  createdAt: z.string(),
  report: z.string(),
  previewUrl: z.string().url().optional(),
  changedFiles: z.array(z.string()).optional(),
  testOutput: z.string().optional(),
  diff: z.string().optional(),
  mergeRequest: z.object({
    title: z.string(), description: z.string(), baseBranch: z.string(), sourceBranch: z.string(), branchPublished: z.boolean(),
    provider: z.string().optional(), externalId: z.string().optional(), url: z.string().url().optional(), status: z.enum(["draft", "open", "merged"]),
  }).optional(),
});
const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(80),
  appName: z.string().trim().min(1).max(120),
  prompt: z.string().trim().min(1).max(20_000),
  repository: z.string().trim().min(1).max(1_024),
  ownedPaths: z.array(z.string().trim().min(1).max(1_024)).min(1).max(32),
});
const healthSchema = z.object({ status: z.literal("ok"), providers: z.array(z.string()) });
const skillSchema = z.object({ id: z.string(), name: z.string(), enabled: z.boolean() });
const overviewSchema = z.object({ agents: z.array(z.object({ id: z.string(), name: z.string(), status: z.enum(["ready", "busy", "offline"]), capabilities: z.array(z.string()) })), artifacts: z.array(z.object({ id: z.string(), name: z.string(), kind: z.enum(["workspace", "preview", "patch", "report"]), status: z.enum(["ready", "pending", "expired"]) })), components: z.array(z.string()), containerId: z.string().optional(), containerName: z.string().optional(), frontEndPortUrl: z.string().url(), latencyMs: z.number().nonnegative(), mode: z.literal("local-edge"), previewPorts: z.array(z.number()), runnerUrl: z.string(), serverId: z.string().uuid(), skills: z.array(skillSchema), tasks: z.array(taskSchema) });
const cxforgeOverviewSchema = overviewSchema.omit({ latencyMs: true, frontEndPortUrl: true });
const skillUpdateSchema = z.object({ skills: z.array(z.object({ id: z.string(), enabled: z.boolean() })).min(1).max(64) });
const taskParamsSchema = z.object({ id: z.string().uuid() });
const errorSchema = z.object({ error: z.string() });
const providerTaskResponses = { 200: taskSchema, 404: errorSchema, 409: errorSchema, 502: errorSchema, 503: errorSchema };
const runtimeActionSchema = z.enum(["build", "install", "restart", "start", "stop"]);
const runtimeStatusSchema = z.object({
  composeFile: z.string(),
  composeVersion: z.string().optional(),
  container: z.object({
    health: z.string().optional(), id: z.string().optional(), image: z.string().optional(), installed: z.boolean(), name: z.string(), running: z.boolean(), state: z.enum(["absent", "exited", "running", "unavailable"]),
  }),
  dockerAvailable: z.boolean(),
  dockerVersion: z.string().optional(),
  projectName: z.string(),
  toolchain: z.object({ git: z.string().optional(), go: z.string().optional(), node: z.string().optional(), npm: z.string().optional(), python: z.string().optional() }),
});
const runtimeLogsSchema = z.object({ lines: z.array(z.string()) });

interface CxforgeClientOptions {
  readonly baseUrl: string;
  readonly clientKey: string;
  readonly gitProvider: GitProvider;
  readonly runtimeManager: CxforgeRuntimeManager;
}

export function registerCxforgeRoutes(app: FastifyInstance, options: CxforgeClientOptions): void {
  const client = new CxforgeClient(options);

  app.get("/api/v1/zuno/cxforge/health", { schema: { response: { 200: healthSchema } } }, async () => client.get("/api/v1/cxforge/health", healthSchema));
  app.get("/api/v1/zuno/cxforge/runtime", { schema: { response: { 200: runtimeStatusSchema } } }, async () => options.runtimeManager.status());
  app.get("/api/v1/zuno/cxforge/runtime/logs", { schema: { response: { 200: runtimeLogsSchema } } }, async () => ({ lines: await options.runtimeManager.logs() }));
  app.post("/api/v1/zuno/cxforge/runtime/:action", { schema: { params: z.object({ action: runtimeActionSchema }), response: { 200: runtimeStatusSchema, 502: errorSchema } } }, async (request, reply) => {
    const { action } = z.object({ action: runtimeActionSchema }).parse(request.params);
    try {
      return await options.runtimeManager.act(action);
    } catch {
      return reply.code(502).send({ error: `CXForge runtime ${action} failed.` });
    }
  });
  app.get("/api/v1/zuno/cxforge/overview", { schema: { response: { 200: overviewSchema } } }, async () => {
    const startedAt = performance.now();
    const overview = await client.get("/api/v1/cxforge/control/overview", cxforgeOverviewSchema);
    const previewUrl = new URL(overview.runnerUrl);
    previewUrl.port = String(overview.previewPorts[0]);
    return { ...overview, frontEndPortUrl: previewUrl.toString().replace(/\/$/u, ""), latencyMs: Math.round(performance.now() - startedAt) };
  });
  app.get("/api/v1/zuno/cxforge/skills", { schema: { response: { 200: z.array(skillSchema) } } }, async () => client.get("/api/v1/cxforge/control/skills", z.array(skillSchema)));
  app.put("/api/v1/zuno/cxforge/skills", { schema: { body: skillUpdateSchema, response: { 200: z.array(skillSchema) } } }, async (request) => client.put("/api/v1/cxforge/control/skills", skillUpdateSchema.parse(request.body), z.array(skillSchema)));
  app.post("/api/v1/zuno/cxforge/tasks", { schema: { body: createTaskSchema, response: { 201: taskSchema } } }, async (request, reply) => {
    const task = await client.post("/api/v1/cxforge/control/tasks", createTaskSchema.parse(request.body), taskSchema);
    return reply.code(201).send(task);
  });
  app.post("/api/v1/zuno/cxforge/tasks/:id/queue", { schema: { params: z.object({ id: z.string().uuid() }), response: { 200: taskSchema } } }, async (request) => {
    return client.post(`/api/v1/cxforge/control/tasks/${z.object({ id: z.string().uuid() }).parse(request.params).id}/queue`, {}, taskSchema);
  });
  app.post("/api/v1/zuno/cxforge/tasks/:id/approve", { schema: { params: z.object({ id: z.string().uuid() }), response: { 200: taskSchema } } }, async (request) => {
    return client.post(`/api/v1/cxforge/control/tasks/${z.object({ id: z.string().uuid() }).parse(request.params).id}/approve`, {}, taskSchema);
  });
  app.post("/api/v1/zuno/cxforge/tasks/:id/reject", { schema: { params: z.object({ id: z.string().uuid() }), response: { 200: taskSchema } } }, async (request) => {
    return client.post(`/api/v1/cxforge/control/tasks/${z.object({ id: z.string().uuid() }).parse(request.params).id}/reject`, {}, taskSchema);
  });
  app.post("/api/v1/zuno/cxforge/tasks/:id/prepare-merge", { schema: { params: z.object({ id: z.string().uuid() }), response: { 200: taskSchema } } }, async (request) => {
    return client.post(`/api/v1/cxforge/control/tasks/${z.object({ id: z.string().uuid() }).parse(request.params).id}/prepare-merge`, {}, taskSchema);
  });
  app.post("/api/v1/zuno/cxforge/tasks/:id/open-merge-request", { schema: { params: taskParamsSchema, response: providerTaskResponses } }, async (request, reply) => {
    if (!options.gitProvider.configured) return reply.code(503).send({ error: "Configure ZUNO_GITHUB_TOKEN before creating pull requests." });
    const id = taskParamsSchema.parse(request.params).id;
    const task = await client.task(id);
    if (!task) return reply.code(404).send({ error: "Task not found." });
    if (!task.mergeRequest || task.mergeRequest.status !== "draft") return reply.code(409).send({ error: "Prepare the merge request draft first." });
    if (!task.mergeRequest.branchPublished) return reply.code(409).send({ error: "CXForge has not published the source branch." });
    try {
      const record = await options.gitProvider.createPullRequest({
        baseBranch: task.mergeRequest.baseBranch, description: task.mergeRequest.description, repository: task.repository,
        sourceBranch: task.mergeRequest.sourceBranch, title: task.mergeRequest.title,
      });
      return client.post(`/api/v1/cxforge/control/tasks/${id}/record-merge-request`, record, taskSchema);
    } catch (error) {
      return reply.code(502).send({ error: error instanceof Error ? error.message : "GitHub pull request creation failed." });
    }
  });
  app.post("/api/v1/zuno/cxforge/tasks/:id/merge", { schema: { params: taskParamsSchema, response: providerTaskResponses } }, async (request, reply) => {
    if (!options.gitProvider.configured) return reply.code(503).send({ error: "Configure ZUNO_GITHUB_TOKEN before merging pull requests." });
    const id = taskParamsSchema.parse(request.params).id;
    const task = await client.task(id);
    if (!task) return reply.code(404).send({ error: "Task not found." });
    if (!task.mergeRequest?.externalId || task.mergeRequest.status !== "open") return reply.code(409).send({ error: "Only an open pull request can be merged." });
    try {
      await options.gitProvider.mergePullRequest(task.repository, task.mergeRequest.externalId);
      return client.post(`/api/v1/cxforge/control/tasks/${id}/record-merged`, {}, taskSchema);
    } catch (error) {
      return reply.code(502).send({ error: error instanceof Error ? error.message : "GitHub pull request merge failed." });
    }
  });
}

class CxforgeClient {
  constructor(private readonly options: CxforgeClientOptions) {}

  async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    return this.request(path, schema);
  }

  async post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    return this.request(path, schema, { body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, method: "POST" });
  }

  async put<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    return this.request(path, schema, { body: JSON.stringify(body), headers: { "Content-Type": "application/json" }, method: "PUT" });
  }

  async task(id: string): Promise<z.infer<typeof taskSchema> | undefined> {
    const overview = await this.get("/api/v1/cxforge/control/overview", cxforgeOverviewSchema);
    return overview.tasks.find((task) => task.id === id);
  }

  private async request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: { ...init?.headers, "X-CXForge-Client-Key": this.options.clientKey },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`CXForge returned ${response.status}.`);
    return schema.parse(await response.json());
  }
}
