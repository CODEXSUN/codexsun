import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { CompanyService } from "./company.service.js";
import { companyInput, companyRecord } from "./company.types.js";
export async function registerCompanyRoutes(app: FastifyInstance, resolve: ResolveTconnectContext) {
  registerContractRoute(app, {
    method: "GET",
    url: "/public/tconnect/company",
    schemas: { response: z.array(companyRecord) },
    handler: async ({ request }) => new CompanyService(await resolve(request, true)).list(true)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/company",
    schemas: { response: z.array(companyRecord) },
    handler: async ({ request }) => {
      const context = await resolve(request, false);
      return new CompanyService(context).list(false);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/company",
    schemas: { body: companyInput, response: companyRecord },
    handler: async ({ request, body }) =>
      new CompanyService(await resolve(request, false)).save(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/company/:uuid",
    schemas: {
      params: z.object({ uuid: z.string().regex(/^[0-9a-f]{8}$/) }),
      body: companyInput,
      response: companyRecord
    },
    handler: async ({ request, body, params }) =>
      new CompanyService(await resolve(request, false)).save(body, params.uuid)
  });
}
