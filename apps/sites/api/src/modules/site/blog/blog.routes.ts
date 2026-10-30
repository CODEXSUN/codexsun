import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerContractRoute } from "@codexsun/framework/http";
import { z } from "zod";
import { blogSaveSchema, blogRecordSchema } from "./blog.schema.js";
import type { BlogService } from "./blog.service.js";
type BlogAccess = (
  request: FastifyRequest,
  uuid: string,
  action: "view" | "update" | "publish" | "delete"
) => Promise<{ service: BlogService; actor: string }>;
export function registerBlogRoutes(app: FastifyInstance, access: BlogAccess) {
  const uuid = z.string().regex(/^[a-f0-9]{8}$/);
  const siteParams = z.strictObject({ uuid });
  const params = z.strictObject({ uuid, postUuid: uuid });
  const revision = z.strictObject({ revision: z.number().int().positive() });
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/:uuid/blogs",
    schemas: { params: siteParams, response: z.array(blogRecordSchema) },
    handler: async ({ request, params }) =>
      (await access(request, params.uuid, "view")).service.list()
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/sites/:uuid/blogs",
    schemas: { params: siteParams, body: blogSaveSchema, response: blogRecordSchema },
    handler: async ({ request, params, body }) => {
      const ctx = await access(request, params.uuid, "update");
      return ctx.service.save(null, body.content, body.revision, ctx.actor);
    }
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/sites/:uuid/blogs/:postUuid",
    schemas: { params, body: blogSaveSchema, response: blogRecordSchema },
    handler: async ({ request, params, body }) => {
      const ctx = await access(request, params.uuid, "update");
      return ctx.service.save(params.postUuid, body.content, body.revision, ctx.actor);
    }
  });
  for (const action of ["publish", "unpublish"] as const)
    registerContractRoute(app, {
      method: "POST",
      url: `/sites/:uuid/blogs/:postUuid/${action}`,
      schemas: { params, body: revision, response: z.array(blogRecordSchema) },
      handler: async ({ request, params, body }) => {
        const ctx = await access(request, params.uuid, "publish");
        return ctx.service.publication(
          params.postUuid,
          body.revision,
          ctx.actor,
          action === "publish"
        );
      }
    });
  registerContractRoute(app, {
    method: "POST",
    url: "/sites/:uuid/blogs/:postUuid/delete",
    schemas: { params, body: revision, response: z.strictObject({ deleted: z.boolean() }) },
    handler: async ({ request, params, body }) => {
      const ctx = await access(request, params.uuid, "delete");
      return ctx.service.delete(params.postUuid, body.revision, ctx.actor);
    }
  });
}
