import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { CredentialService } from "./credential.service.js";
import { credentialInput, credentialRecord, publicCredential } from "./credential.types.js";
export async function registerCredentialRoutes(
  app: FastifyInstance,
  resolve: ResolveTconnectContext
) {
  registerContractRoute(app, {
    method: "GET",
    url: "/public/tconnect/credential",
    schemas: { response: z.array(publicCredential) },
    handler: async ({ request }) => new CredentialService(await resolve(request, true)).publicList()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/credential",
    schemas: { response: z.array(credentialRecord) },
    handler: async ({ request }) => new CredentialService(await resolve(request, false)).list()
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/credential",
    schemas: { body: credentialInput, response: credentialRecord },
    handler: async ({ request, body }) =>
      new CredentialService(await resolve(request, false)).save(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/credential/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }),
      body: credentialInput,
      response: credentialRecord
    },
    handler: async ({ request, params, body }) =>
      new CredentialService(await resolve(request, false)).save(body, params.uuid)
  });
}
