import type { FastifyInstance } from "fastify";
import { z } from "zod";

const taskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  appName: z.string(),
  prompt: z.string(),
  repository: z.string(),
  ownedPaths: z.array(z.string()),
  status: z.enum(["draft", "queued", "running", "review", "approved", "rejected", "blocked"]),
  createdAt: z.string(),
  report: z.string(),
  previewUrl: z.string().url().optional(),
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
const skillUpdateSchema = z.object({ skills: z.array(z.object({ id: z.string(), enabled: z.boolean() })).min(1).max(64) });

interface CxforgeClientOptions {
  readonly baseUrl: string;
  readonly clientKey: string;
}

export function registerCxforgeRoutes(app: FastifyInstance, options: CxforgeClientOptions): void {
  const client = new CxforgeClient(options);

  app.get("/api/v1/zuno/cxforge/health", { schema: { response: { 200: healthSchema } } }, async () => client.get("/api/v1/cxforge/health", healthSchema));
  app.get("/api/v1/zuno/cxforge/overview", { schema: { response: { 200: overviewSchema } } }, async () => {
    const startedAt = performance.now();
    const overview = await client.get("/api/v1/cxforge/control/overview", overviewSchema.omit({ latencyMs: true, frontEndPortUrl: true }));
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
