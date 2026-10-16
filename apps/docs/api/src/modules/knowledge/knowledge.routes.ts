import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { KnowledgeService } from "./knowledge.service.js";
import type { KnowledgeContext } from "./knowledge.types.js";
const uuid = z.string().regex(/^[a-f0-9]{8}$/);
const record = z.object({
  uuid,
  pageKey: z.string(),
  appKey: z.string(),
  appLabel: z.string(),
  groupKey: z.string(),
  groupLabel: z.string(),
  moduleKey: z.string(),
  title: z.string(),
  summary: z.string(),
  sourcePath: z.string(),
  sourceHash: z.string(),
  sortOrder: z.number().int(),
  revision: z.number().int(),
  hasOverride: z.boolean(),
  updatedAt: z.string()
});
const page = record.extend({
  body: z.string(),
  format: z.enum(["md", "mdx"]),
  origin: z.enum(["repository", "database"]),
  activity: z.array(
    z.object({ action: z.string(), actor: z.string(), summary: z.string(), createdAt: z.string() })
  )
});
export function registerKnowledgeRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<KnowledgeContext>
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/docs/knowledge",
    schemas: { response: z.object({ pages: z.array(record), canEdit: z.boolean() }) },
    handler: async ({ request, reply }) => {
      reply.header("Cache-Control", "no-store");
      const scope = await context(request);
      let canEdit = false;
      try {
        await scope.authorize("docs.knowledge.edit");
        canEdit = true;
      } catch (error) {
        if (
          !error ||
          typeof error !== "object" ||
          !("statusCode" in error) ||
          error.statusCode !== 403
        )
          throw error;
      }
      return { pages: await new KnowledgeService(scope).catalog(), canEdit };
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/docs/knowledge/:uuid",
    schemas: { params: z.object({ uuid }), response: page },
    handler: async ({ params, request, reply }) => {
      reply.header("Cache-Control", "no-store");
      return new KnowledgeService(await context(request)).page(params.uuid);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/docs/knowledge/:uuid",
    bodyLimit: 140000,
    schemas: {
      params: z.object({ uuid }),
      body: z
        .object({
          body: z.string().max(128000).nullable(),
          expectedRevision: z.number().int().positive()
        })
        .strict(),
      response: page
    },
    handler: async ({ params, body, request }) =>
      new KnowledgeService(await context(request)).save(params.uuid, body)
  });
}
