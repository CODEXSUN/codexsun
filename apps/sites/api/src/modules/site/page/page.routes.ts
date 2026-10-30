import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { pageStateSchema, pageSaveSchema } from "./page.schema.js";
import type { PageService } from "./page.service.js";
type PageAccess = (
  request: FastifyRequest,
  uuid: string,
  action: "view" | "update" | "publish"
) => Promise<{ service: PageService; actor: string }>;
export function registerPageRoutes(app: FastifyInstance, access: PageAccess) {
  const params = z.strictObject({ uuid: z.string().regex(/^[a-f0-9]{8}$/) });
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/:uuid/page",
    schemas: { params, response: pageStateSchema },
    handler: async ({ request, params }) =>
      (await access(request, params.uuid, "view")).service.show()
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/sites/:uuid/page",
    schemas: { params, body: pageSaveSchema, response: pageStateSchema },
    handler: async ({ request, params, body }) => {
      const ctx = await access(request, params.uuid, "update");
      return ctx.service.save(body.content, body.revision, ctx.actor);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/sites/:uuid/page/publish",
    schemas: {
      params,
      body: z.strictObject({ revision: z.number().int().positive() }),
      response: pageStateSchema
    },
    handler: async ({ request, params, body }) => {
      const ctx = await access(request, params.uuid, "publish");
      return ctx.service.publish(body.revision, ctx.actor);
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/:uuid/page/activity",
    schemas: {
      params,
      response: z.array(
        z.strictObject({
          actor: z.string(),
          action: z.string(),
          revision: z.number(),
          created_at: z.string()
        })
      )
    },
    handler: async ({ request, params }) => {
      const ctx = await access(request, params.uuid, "view");
      const rows = await ctx.service.activity();
      return rows.map((row) => ({ ...row, created_at: String(row.created_at) }));
    }
  });
}
