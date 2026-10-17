import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { CommunityService } from "./community.service.js";
import { communityInput, communityRecord } from "./community.types.js";
export async function registerCommunityRoutes(
  app: FastifyInstance,
  resolve: ResolveTconnectContext
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/public/tconnect/community",
    schemas: { response: z.array(communityRecord) },
    handler: async ({ request }) => new CommunityService(await resolve(request, true)).list(true)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/community",
    schemas: { response: z.array(communityRecord) },
    handler: async ({ request }) => {
      const context = await resolve(request, false);
      await context.authorize("tconnect.community.view");
      return new CommunityService(context).list(false);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/community",
    schemas: { body: communityInput, response: communityRecord },
    handler: async ({ request, body }) =>
      new CommunityService(await resolve(request, false)).save(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/community/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }),
      body: communityInput,
      response: communityRecord
    },
    handler: async ({ request, body, params }) =>
      new CommunityService(await resolve(request, false)).save(body, params.uuid)
  });
}
