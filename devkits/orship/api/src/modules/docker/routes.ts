import type { FastifyInstance } from "fastify";
import { z } from "zod";

const dockerPortSchema = z.object({
  ip: z.string().optional(),
  privatePort: z.number().int(),
  publicPort: z.number().int().optional(),
  type: z.string(),
});

const dockerContainerSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{12,64}$/u),
  image: z.string(),
  name: z.string(),
  ports: z.array(dockerPortSchema),
  state: z.string(),
  status: z.string(),
});

const dockerContainersResponseSchema = z.object({ containers: z.array(dockerContainerSchema) });
const dockerActionResponseSchema = z.object({ action: z.string(), status: z.string() });
const dockerMetricsSchema = z.object({
  blockReadBytes: z.number().int().nonnegative(),
  blockWriteBytes: z.number().int().nonnegative(),
  collectedAt: z.string(),
  cpuPercent: z.number(),
  memoryLimitBytes: z.number().int().nonnegative(),
  memoryPercent: z.number(),
  memoryUsageBytes: z.number().int().nonnegative(),
  networkRxBytes: z.number().int().nonnegative(),
  networkTxBytes: z.number().int().nonnegative(),
});
const dockerSnapshotSchema = z.object({ container: dockerContainerSchema, logs: z.array(z.string()), metrics: dockerMetricsSchema });
const mariaDbSampleSchema = z.object({
  backupVolume: z.string(),
  containerPort: z.string(),
  dataVolume: z.string(),
  database: z.string(),
  hostPort: z.string(),
  image: z.string(),
  name: z.string(),
  network: z.string(),
  hostIp: z.string(),
  restartPolicy: z.string(),
});
const mariaDbInstallResponseSchema = z.object({ container: dockerContainerSchema, sample: mariaDbSampleSchema });
const mariaDbDropResponseSchema = z.object({ name: z.string(), status: z.literal("dropped") });
const dockerActionSchema = z.object({ action: z.enum(["start", "stop", "restart"]) });

type DockerRoutesConfig = {
  readonly managerToken: string;
  readonly managerUrl: string;
};

export async function registerDockerRoutes(app: FastifyInstance, config: DockerRoutesConfig): Promise<void> {
  app.get(
    "/api/v1/orship/docker/containers",
    { schema: { response: { 200: dockerContainersResponseSchema, 502: z.object({ error: z.string() }) }, tags: ["Docker"] } },
    async (_request, reply) => {
      const result = await requestDockerManager(config, "/containers");
      return result.ok ? dockerContainersResponseSchema.parse(result.body) : reply.code(502).send({ error: result.error });
    },
  );

  app.post(
    "/api/v1/orship/docker/containers/:id/:action",
    {
      schema: {
        params: z.object({ action: z.enum(["start", "stop", "restart"]), id: z.string().regex(/^[a-f0-9]{12,64}$/u) }),
        response: { 200: dockerActionResponseSchema, 502: z.object({ error: z.string() }) },
        tags: ["Docker"],
      },
    },
    async (request, reply) => {
      const params = dockerActionSchema.extend({ id: z.string() }).parse(request.params);
      const result = await requestDockerManager(config, `/containers/${params.id}/${params.action}`, "POST");
      return result.ok ? dockerActionResponseSchema.parse(result.body) : reply.code(502).send({ error: result.error });
    },
  );

  app.get(
    "/api/v1/orship/docker/containers/:id/snapshot",
    {
      schema: {
        params: z.object({ id: z.string().regex(/^[a-f0-9]{12,64}$/u) }),
        response: { 200: dockerSnapshotSchema, 502: z.object({ error: z.string() }) },
        tags: ["Docker"],
      },
    },
    async (request, reply) => {
      const params = z.object({ id: z.string() }).parse(request.params);
      const result = await requestDockerManager(config, `/containers/${params.id}/snapshot`);
      return result.ok ? dockerSnapshotSchema.parse(result.body) : reply.code(502).send({ error: result.error });
    },
  );

  for (const action of ["install", "reinstall"] as const) {
    app.post(
      `/api/v1/orship/docker/samples/mariadb/${action}`,
      { schema: { response: { 201: mariaDbInstallResponseSchema, 502: z.object({ error: z.string() }) }, tags: ["Docker"] } },
      async (_request, reply) => {
        const result = await requestDockerManager(config, `/samples/mariadb/${action}`, "POST");
        return result.ok ? reply.code(201).send(mariaDbInstallResponseSchema.parse(result.body)) : reply.code(502).send({ error: result.error });
      },
    );
  }

  app.post(
    "/api/v1/orship/docker/samples/mariadb/drop",
    { schema: { response: { 200: mariaDbDropResponseSchema, 502: z.object({ error: z.string() }) }, tags: ["Docker"] } },
    async (_request, reply) => {
      const result = await requestDockerManager(config, "/samples/mariadb/drop", "POST");
      return result.ok ? mariaDbDropResponseSchema.parse(result.body) : reply.code(502).send({ error: result.error });
    },
  );
}

async function requestDockerManager(
  config: DockerRoutesConfig,
  path: string,
  method: "GET" | "POST" = "GET",
): Promise<{ readonly body: unknown; readonly ok: true } | { readonly error: string; readonly ok: false }> {
  try {
    const response = await fetch(`${config.managerUrl.replace(/\/$/u, "")}${path}`, {
      headers: { authorization: `Bearer ${config.managerToken}` },
      method,
      signal: AbortSignal.timeout(path.startsWith("/samples/mariadb/") ? 5 * 60_000 : 20_000),
    });
    const body = await response.json() as unknown;
    if (!response.ok) {
      const error = body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Docker manager request failed: ${response.status}`;
      return { error, ok: false };
    }
    return { body, ok: true };
  } catch {
    return { error: "Docker manager is unavailable.", ok: false };
  }
}
