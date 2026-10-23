import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { MarketingDependencies } from "../../context.js";
import {
  ConnectionAuthorizationService,
  type ConnectionAuthorization
} from "./connection.oauth.js";

export function registerConnectionAuthorization(
  app: FastifyInstance,
  context: MarketingDependencies["context"],
  authorization: (request: FastifyRequest) => Promise<ConnectionAuthorization>
) {
  const params = z.object({ uuid: z.string().regex(/^[a-f0-9]{8}$/) });
  const state = z.string().min(40).max(200);
  const service = async (request: FastifyRequest) =>
    new ConnectionAuthorizationService(await context(request), await authorization(request));
  registerContractRoute(app, {
    method: "POST",
    url: "/marketing/connections/:uuid/oauth/begin",
    schemas: { params, response: z.object({ url: z.url() }) },
    handler: async ({ request, params }) => (await service(request)).begin(params.uuid)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/marketing/connections/:uuid/oauth/complete",
    schemas: {
      params,
      body: z.strictObject({ state, code: z.string().min(1).max(4000) }),
      response: z.object({ accounts: z.array(z.object({ id: z.string(), label: z.string() })) })
    },
    handler: async ({ request, params, body }) =>
      (await service(request)).complete(params.uuid, body.state, body.code)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/marketing/connections/:uuid/oauth/select",
    schemas: {
      params,
      body: z.strictObject({ state, accountId: z.string().min(1).max(191) }),
      response: z.object({ connected: z.boolean(), capabilities: z.array(z.string()) })
    },
    handler: async ({ request, params, body }) =>
      (await service(request)).select(params.uuid, body.state, body.accountId)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/marketing/connections/:uuid/health",
    schemas: {
      params,
      response: z.object({
        connected: z.boolean(),
        accountId: z.string(),
        capabilities: z.array(z.string()),
        expiresAt: z.string().nullable()
      })
    },
    handler: async ({ request, params }) => (await service(request)).health(params.uuid)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/marketing/connections/:uuid/disconnect",
    schemas: { params, response: z.object({ disconnected: z.boolean() }) },
    handler: async ({ request, params }) => (await service(request)).disconnect(params.uuid)
  });
}
