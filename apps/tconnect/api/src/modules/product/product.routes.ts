import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type { ResolveTconnectContext } from "../../context.js";
import { ProductService } from "./product.service.js";
import {
  productInput,
  productRecord,
  productSearchQuery,
  catalogProduct
} from "./product.types.js";
export async function registerProductRoutes(app: FastifyInstance, resolve: ResolveTconnectContext) {
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/product/search",
    schemas: { querystring: productSearchQuery, response: z.array(catalogProduct) },
    handler: async ({ request, query }) =>
      new ProductService(await resolve(request, false)).search(query.q)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/public/tconnect/product/search",
    schemas: { querystring: productSearchQuery, response: z.array(catalogProduct) },
    handler: async ({ request, query }) =>
      new ProductService(await resolve(request, true)).publicSearch(query.q)
  });
  const id = z.string().regex(/^[0-9a-f]{8}$/);
  const publicQuery = z.object({ companyUuid: id }).strict();
  registerContractRoute(app, {
    method: "GET",
    url: "/public/tconnect/product",
    schemas: { querystring: publicQuery, response: z.array(productRecord) },
    handler: async ({ request, query }) =>
      new ProductService(await resolve(request, true)).list(query.companyUuid, true)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/tconnect/product",
    schemas: { response: z.array(productRecord) },
    handler: async ({ request }) => new ProductService(await resolve(request, false)).list()
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/tconnect/product",
    schemas: { body: productInput, response: productRecord },
    handler: async ({ request, body }) =>
      new ProductService(await resolve(request, false)).save(body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/tconnect/product/:uuid",
    schemas: { params: z.object({ uuid: id }), body: productInput, response: productRecord },
    handler: async ({ request, params, body }) =>
      new ProductService(await resolve(request, false)).save(body, params.uuid)
  });
}
