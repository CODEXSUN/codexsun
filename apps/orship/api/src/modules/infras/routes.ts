import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { CreateInfraInput, OrshipInfraRecord } from "./infras-store.js";

type InfrasStorePort = {
  create(input: CreateInfraInput): OrshipInfraRecord | Promise<OrshipInfraRecord>;
  get(uuid: string): OrshipInfraRecord | undefined | Promise<OrshipInfraRecord | undefined>;
  list(): OrshipInfraRecord[] | Promise<OrshipInfraRecord[]>;
};

const infraDetailSchema = z.object({
  connectionStrength: z.string(),
  containerName: z.string(),
  endpoint: z.string(),
  image: z.string(),
  latencyMs: z.number(),
  port: z.number(),
  ports: z.string(),
  rootPasswordHidden: z.string(),
  rootUser: z.string(),
});

const infraLogSchema = z.object({
  level: z.union([z.literal("info"), z.literal("warning")]),
  line: z.string(),
  time: z.string(),
});

const infraMetricSchema = z.object({
  label: z.string(),
  percent: z.number().optional(),
  series: z.array(z.number()),
  value: z.string(),
});

const infraSchema = z.object({
  composeYaml: z.string(),
  description: z.string(),
  detail: infraDetailSchema,
  id: z.number(),
  kind: z.literal("infras"),
  logs: z.array(infraLogSchema),
  metrics: z.array(infraMetricSchema),
  name: z.string(),
  status: z.string(),
  summary: z.string(),
  uuid: z.string().uuid(),
});

const createInfraSchema = z.object({
  composeYaml: z.string().min(1),
  containerName: z.string().min(1),
  description: z.string().min(1),
  image: z.string().min(1),
  name: z.string().min(1),
  port: z.number().int().min(1).max(65_535),
  ports: z.string().min(1),
  rootUser: z.string().min(1),
  summary: z.string().min(1),
});

export async function registerInfrasRoutes(app: FastifyInstance, store: InfrasStorePort): Promise<void> {
  app.get(
    "/api/v1/orship/infras",
    { schema: { response: { 200: z.object({ infras: z.array(infraSchema) }) }, tags: ["Infras"] } },
    async () => ({ infras: await store.list() }),
  );

  app.post(
    "/api/v1/orship/infras",
    {
      schema: {
        body: createInfraSchema,
        response: { 201: z.object({ infra: infraSchema }) },
        tags: ["Infras"],
      },
    },
    async (request, reply) => {
      const input = createInfraSchema.parse(request.body);
      return reply.code(201).send({ infra: await store.create(input) });
    },
  );

  app.get(
    "/api/v1/orship/infras/:uuid",
    {
      schema: {
        params: z.object({ uuid: z.string().uuid() }),
        response: { 200: z.object({ infra: infraSchema }), 404: z.object({ error: z.string(), code: z.string() }) },
        tags: ["Infras"],
      },
    },
    async (request, reply) => {
      const { uuid } = request.params as { uuid: string };
      const infra = await store.get(uuid);
      if (!infra) return reply.code(404).send({ error: "Infra record not found.", code: "infras.not_found" });
      return { infra };
    },
  );
}
