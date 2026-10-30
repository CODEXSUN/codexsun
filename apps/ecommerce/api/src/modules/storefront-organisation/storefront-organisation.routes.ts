import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { StorefrontOrganisationService } from "./storefront-organisation.service.js";
import { StorefrontOrganisationLogoStorage } from "./storefront-organisation.storage.js";

export function registerStorefrontOrganisationRoutes(
  app: FastifyInstance,
  actor: (request: FastifyRequest) => string
) {
  const service = new StorefrontOrganisationService();
  const input = z
    .object({
      companyId: z.number().int().positive(),
      financialYearId: z.number().int().positive(),
      displayName: z.string().trim().max(191).default(""),
      logoFileName: z
        .string()
        .regex(/^[a-f0-9]{32}\.png$/u)
        .nullable()
        .default(null)
    })
    .strict();
  const record = z.object({
    companyId: z.number().nullable(),
    financialYearId: z.number().nullable(),
    displayName: z.string(),
    logoFileName: z.string().nullable()
  });
  const option = z.object({ id: z.number(), label: z.string() });
  registerContractRoute(app, {
    method: "POST",
    url: "/ecommerce/storefront/organisation/logo",
    bodyLimit: 3 * 1024 * 1024,
    schemas: {
      body: z.object({ contentBase64: z.string().min(1).max(2_800_000) }).strict(),
      response: z.object({ logoFileName: z.string() })
    },
    handler: async ({ body, request }) => {
      const result = await new StorefrontOrganisationLogoStorage().upload(body.contentBase64);
      request.log.info(
        {
          action: "ecommerce.storefront.logo.upload",
          actorEmail: actor(request),
          fileName: result.logoFileName
        },
        "Storefront logo uploaded"
      );
      return result;
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/ecommerce/storefront/organisation",
    schemas: { response: record },
    handler: () => service.get()
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/ecommerce/storefront/organisation",
    schemas: { body: input, response: record },
    handler: ({ body, request }) => service.save(body, actor(request))
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/ecommerce/storefront/organisation/options",
    schemas: {
      response: z.object({ companies: z.array(option), financialYears: z.array(option) })
    },
    handler: async () => {
      const { companies, financialYears } = await service.options();
      return { companies, financialYears };
    }
  });
}
