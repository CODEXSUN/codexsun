import { registerEnquiryRoutes } from "./enquiry/enquiry.routes.js";
import { sitePublicationSchema } from "./site.public-contract.js";
import { registerContractRoute } from "@codexsun/framework/http";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Kysely } from "kysely";
import { z } from "zod";
import { SiteRepository } from "./site.repository.js";
import { SiteService } from "./site.service.js";
import type { SitesDatabase, SitesRequestContext } from "./site.types.js";
import { AppError } from "@codexsun/framework/errors";
import { authorizeSitesAction } from "../overview/index.js";
import { SiteRuntimeService } from "./site.runtime.js";
import { pageModule, PageRepository, PageService } from "./page/index.js";
import { blogModule, BlogRepository, BlogService } from "./blog/index.js";
import { SitePublicReader } from "./site.public.js";
import {
  publicationModule,
  PublicationRepository,
  PublicationService
} from "./publication/index.js";

const siteStatusSchema = z.enum(["active", "draft", "suspended"]);

const siteResponseSchema = z.strictObject({
  createdAt: z.string(),
  description: z.string(),
  id: z.number().int(),
  name: z.string(),
  port: z.number().int(),
  primaryDomain: z.string(),
  publishedPages: z.number().int(),
  slug: z.string(),
  status: siteStatusSchema,
  themeKey: z.string(),
  updatedAt: z.string(),
  uuid: z.string().length(8)
});

const sitePayloadSchema = z.strictObject({
  description: z.string().max(255).optional(),
  name: z.string().min(1).max(160),
  port: z.number().int().min(1024).max(65535),
  primaryDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/)
    .max(255),
  slug: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,119}$/),
  themeKey: z.string().min(1).max(120)
});

const siteParamsSchema = z.strictObject({
  uuid: z.string().length(8)
});

export function registerSiteRoutes(
  app: FastifyInstance,
  resolveContext: (request: FastifyRequest) => SitesRequestContext | Promise<SitesRequestContext>
) {
  const runtime = new SiteRuntimeService();
  const publicReader = new SitePublicReader();
  registerEnquiryRoutes(app, async (request, uuid, action) => {
    const identity = await authorizeSitesAction(app, request, `sites.enquiry.inbox.${action}`);
    const ctx = await resolveContext(request);
    await new SiteService(new SiteRepository(ctx.database as Kysely<SitesDatabase>)).show(uuid);
    return { tenantId: ctx.tenantId, actor: identity.actorEmail };
  });

  publicationModule.register(app, async (request, uuid) => {
    const identity = await authorizeSitesAction(app, request, "sites.site.publication.export");
    const ctx = await resolveContext(request);
    const database = ctx.database as Kysely<SitesDatabase>;
    const site = await new SiteService(new SiteRepository(database)).show(uuid);
    return {
      actor: identity.actorEmail,
      service: new PublicationService(new PublicationRepository(database), site, ctx.tenantId),
      content: await new PageService(new PageRepository(database), site).published(),
      blogs: await new BlogService(new BlogRepository(database), site).published()
    };
  });
  pageModule.register(app, async (request, uuid, action) => {
    const identity = await authorizeSitesAction(app, request, `sites.page.content.${action}`);
    const ctx = await resolveContext(request);
    const database = ctx.database as Kysely<SitesDatabase>;
    const site = await new SiteService(new SiteRepository(database)).show(uuid);
    return {
      service: new PageService(new PageRepository(database), site),
      actor: identity.actorEmail
    };
  });
  blogModule.register(app, async (request, uuid, action) => {
    const identity = await authorizeSitesAction(app, request, `sites.blog.post.${action}`);
    const ctx = await resolveContext(request);
    const database = ctx.database as Kysely<SitesDatabase>;
    const site = await new SiteService(new SiteRepository(database)).show(uuid);
    return {
      service: new BlogService(new BlogRepository(database), site),
      actor: identity.actorEmail
    };
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/sites/public/:slug",
    schemas: {
      params: z.strictObject({ slug: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,119}$/) }),
      response: sitePublicationSchema
    },
    handler: async ({ reply, params }) => {
      reply.header("Cache-Control", "no-store");
      return publicReader.read(params.slug);
    }
  });
  app.addHook("onClose", async () => runtime.close());

  registerContractRoute(app, {
    method: "POST",
    url: "/sites/:uuid/start",
    schemas: {
      params: siteParamsSchema,
      response: z.strictObject({
        port: z.number().int(),
        state: z.literal("running"),
        url: z.string()
      })
    },
    handler: async ({ params, request }) => {
      const address = request.raw.socket.remoteAddress;
      if (
        process.env.NODE_ENV !== "development" ||
        !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address ?? "")
      ) {
        throw AppError.forbidden(
          "Client Start is available only from the local development server."
        );
      }
      const identity = await authorizeSitesAction(app, request, "sites.site.runtime.start");
      const site = await (await getService(request)).show(params.uuid);
      request.log.info(
        { actor: identity.actorEmail, siteUuid: site.uuid, port: site.port },
        "Sites client start requested"
      );
      const scope = await resolveContext(request);
      const result = await runtime.start(site, scope.tenantId);
      publicReader.bind(scope.database as Kysely<SitesDatabase>, scope.tenantId, site);
      request.log.info(
        { actor: identity.actorEmail, siteUuid: site.uuid, port: site.port },
        "Sites client ready"
      );
      return result;
    }
  });

  async function getService(request: FastifyRequest) {
    const ctx = await resolveContext(request);
    const db = ctx.database as Kysely<SitesDatabase>;
    return new SiteService(new SiteRepository(db));
  }

  registerContractRoute(app, {
    handler: async ({ request }) => (await getService(request)).list(),
    method: "GET",
    schemas: { response: z.array(siteResponseSchema) },
    url: "/sites"
  });

  registerContractRoute(app, {
    handler: async ({ body, request }) => {
      const identity = await authorizeSitesAction(app, request, "sites.site.registry.create");
      const scope = await resolveContext(request);
      return (scope.database as Kysely<SitesDatabase>)
        .transaction()
        .execute(async (transaction) => {
          const database: Kysely<SitesDatabase> = transaction;
          const site = await new SiteService(new SiteRepository(database)).create(body);
          const page = new PageService(new PageRepository(database), site);
          await page.save((await page.show()).content, 0, identity.actorEmail);
          return site;
        });
    },
    method: "POST",
    schemas: { body: sitePayloadSchema, response: siteResponseSchema },
    url: "/sites"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).show(params.uuid),
    method: "GET",
    schemas: { params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid"
  });

  registerContractRoute(app, {
    handler: async ({ body, params, request }) =>
      (await getService(request)).update(params.uuid, body),
    method: "PUT",
    schemas: { body: sitePayloadSchema, params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).suspend(params.uuid),
    method: "POST",
    schemas: { params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid/suspend"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).restore(params.uuid),
    method: "POST",
    schemas: { params: siteParamsSchema, response: siteResponseSchema },
    url: "/sites/:uuid/restore"
  });

  registerContractRoute(app, {
    handler: async ({ params, request }) => (await getService(request)).delete(params.uuid),
    method: "DELETE",
    schemas: {
      params: siteParamsSchema,
      response: z.strictObject({ deleted: z.boolean(), uuid: z.string().length(8) })
    },
    url: "/sites/:uuid"
  });
}
