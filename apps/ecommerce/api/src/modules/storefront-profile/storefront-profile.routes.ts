import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { StorefrontProfileService } from "./storefront-profile.service.js";

const profileSchema = z.object({
  aboutUs: z.string().max(2000),
  copyrightText: z.string().max(240),
  facebookUrl: z.union([z.literal(""), z.string().url().max(500)]),
  instagramUrl: z.union([z.literal(""), z.string().url().max(500)]),
  linkedinUrl: z.union([z.literal(""), z.string().url().max(500)]),
  paymentMethods: z
    .array(
      z.object({
        logoUrl: z.union([
          z.literal(""),
          z.string().url().max(500),
          z.string().startsWith("/api/platform/storefront/product-images/").max(500)
        ]),
        name: z.string().trim().min(1).max(80)
      })
    )
    .max(12),
  poweredByText: z.string().max(240),
  serviceActionLabel: z.string().max(120),
  serviceActionUrl: z.string().max(500),
  serviceDescription: z.string().max(500),
  serviceEyebrow: z.string().max(120),
  serviceTitle: z.string().max(240),
  tagline: z.string().max(240),
  trustedDescription: z.string().max(500),
  trustedEyebrow: z.string().max(120),
  trustedProofPoints: z.string().max(1000),
  trustedTitle: z.string().max(240),
  threadsUrl: z.union([z.literal(""), z.string().url().max(500)]),
  whatsappUrl: z.union([z.literal(""), z.string().url().max(500)]),
  xUrl: z.union([z.literal(""), z.string().url().max(500)]),
  youtubeUrl: z.union([z.literal(""), z.string().url().max(500)])
});

export async function registerStorefrontProfilePublicRoutes(app: FastifyInstance) {
  const service = new StorefrontProfileService();
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/profile",
    schemas: { response: profileSchema },
    handler: () => service.get()
  });
}

export async function registerStorefrontProfileRoutes(
  app: FastifyInstance,
  resolveActorEmail: (request: FastifyRequest) => string
) {
  const service = new StorefrontProfileService();
  registerContractRoute(app, {
    method: "GET",
    url: "/ecommerce/storefront/profile",
    schemas: { response: profileSchema },
    handler: () => service.get()
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/ecommerce/storefront/profile",
    schemas: { body: profileSchema, response: profileSchema },
    handler: ({ body, request }) => service.save(body, resolveActorEmail(request))
  });
}
