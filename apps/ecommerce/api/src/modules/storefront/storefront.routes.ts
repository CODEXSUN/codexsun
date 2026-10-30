import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { registerContractRoute } from "@codexsun/framework/http";
import { getEcommerceTenantKey } from "../../database/ecommerce-database.js";
import {
  StorefrontOrganisationService,
  type StorefrontCompanyLogoReader
} from "../storefront-organisation/index.js";
import { StorefrontService } from "./storefront.service.js";
import { StorefrontOrganisationLogoStorage } from "../storefront-organisation/index.js";

const product = z.object({
  brand: z.string().nullable(),
  category: z.string(),
  compareAtPrice: z.number().nullable(),
  description: z.string(),
  featured: z.boolean(),
  featuredOrder: z.number().nullable(),
  imageAlt: z.string(),
  imageUrl: z.string(),
  name: z.string(),
  price: z.number(),
  shortDescription: z.string(),
  slug: z.string(),
  subtitle: z.string(),
  variantCount: z.number()
});
const searchScope = z.enum(["all", "products", "brands", "categories"]);
const sort = z.enum(["featured", "name", "price-asc", "price-desc", "discount"]);
const slider = z.object({
  actionLabel: z.string(),
  actionUrl: z.string(),
  description: z.string(),
  displayOrder: z.number(),
  eyebrow: z.string(),
  imageAlt: z.string(),
  imageUrl: z.string(),
  linkedItem: z.string().nullable(),
  sliderCode: z.string(),
  title: z.string()
});
const promotion = z.object({
  actionLabel: z.string(),
  actionUrl: z.string(),
  badge: z.string(),
  badgePosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]),
  badgeTint: z.string(),
  badgeTextColor: z.string(),
  description: z.string(),
  displayOrder: z.number(),
  eyebrow: z.string(),
  imageAlt: z.string(),
  imageUrl: z.string(),
  linkedItem: z.string().nullable(),
  offerPrice: z.number(),
  originalPrice: z.number().nullable(),
  promotionCode: z.string(),
  title: z.string()
});
const featuredCard = promotion.omit({ promotionCode: true }).extend({ featuredCode: z.string() });
const discovery = z.object({
  brands: z.array(
    z.object({
      logoAlt: z.string(),
      logoUrl: z.string(),
      name: z.string(),
      productCount: z.number()
    })
  ),
  categories: z.array(z.object({ name: z.string(), productCount: z.number() })),
  priceRange: z.object({ maximum: z.number(), minimum: z.number() })
});
const announcement = z
  .object({
    displayDurationMs: z.number(),
    endsAt: z.string().nullable(),
    eventKey: z.string(),
    message: z.string(),
    startsAt: z.string()
  })
  .nullable();
const siteNavigation = z
  .object({
    about: z.string(),
    copyrightText: z.string(),
    groups: z.array(
      z.object({
        title: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() }))
      })
    ),
    paymentMethods: z.array(
      z.object({
        logoUrl: z.union([
          z.literal(""),
          z.string().url(),
          z.string().startsWith("/api/platform/storefront/product-images/")
        ]),
        name: z.string()
      })
    ),
    poweredByText: z.string(),
    serviceBanner: z.object({
      actionLabel: z.string(),
      actionUrl: z.string(),
      description: z.string(),
      eyebrow: z.string(),
      title: z.string()
    }),
    socialLinks: z.array(z.object({ label: z.string(), href: z.string().url() })),
    tagline: z.string(),
    trustedStrip: z.object({
      description: z.string(),
      eyebrow: z.string(),
      proofPoints: z.array(z.string()),
      title: z.string()
    })
  })
  .nullable();

export async function registerStorefrontRoutes(
  app: FastifyInstance,
  service: () => StorefrontService,
  readCompanyLogo?: StorefrontCompanyLogoReader
) {
  const organisation = new StorefrontOrganisationService();
  app.get("/storefront/organisation-logo/:fileName", async (request, reply) => {
    const { fileName } = z
      .object({ fileName: z.string().regex(/^[a-f0-9]{32}\.png$/u) })
      .parse(request.params);
    const content = await new StorefrontOrganisationLogoStorage().content(fileName);
    return reply
      .type("image/png")
      .header("Cache-Control", "public, max-age=31536000, immutable")
      .send(content);
  });
  app.get("/storefront/company-logo/:variant", async (request, reply) => {
    const { variant } = z.object({ variant: z.enum(["logo", "logo-dark"]) }).parse(request.params);
    const company = await organisation.company();
    const configured = variant === "logo" ? company?.logoPath : company?.logoDarkPath;
    const file =
      company && configured && readCompanyLogo
        ? await readCompanyLogo(getEcommerceTenantKey(), company.id, variant)
        : null;
    if (!file) throw AppError.notFound("Storefront company logo was not found.");
    return reply.type(file.mimeType).header("Cache-Control", "no-store").send(file.buffer);
  });
  app.addHook("onSend", async (request, reply, payload) => {
    if (request.raw.url?.startsWith("/storefront/") && !reply.hasHeader("Cache-Control")) {
      reply.header("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    }
    if (request.raw.url?.startsWith("/storefront/")) {
      reply.header("Server-Timing", `app;dur=${reply.elapsedTime.toFixed(1)}`);
    }
    return payload;
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/branding",
    schemas: {
      response: z.object({
        brandName: z.string(),
        logoDarkUrl: z.string().nullable(),
        logoUrl: z.string().nullable(),
        primaryPhone: z.string().nullable()
      })
    },
    handler: () => organisation.branding()
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/storefront/telemetry",
    schemas: {
      body: z
        .object({
          cls: z.number().min(0).max(10),
          inp: z.number().min(0).max(120_000),
          lcp: z.number().min(0).max(120_000),
          path: z.string().max(500)
        })
        .strict(),
      response: z.object({ accepted: z.literal(true) })
    },
    handler: ({ body }) => {
      console.info("[ecommerce.storefront.vitals]", JSON.stringify(body));
      return { accepted: true as const };
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/bootstrap",
    schemas: {
      response: z.object({
        announcement,
        brandStrips: discovery.shape.brands,
        campaignEvents: z.array(promotion),
        discovery,
        featuredCards: z.array(featuredCard),
        promotions: z.array(promotion),
        seasonStrips: z.array(promotion),
        siteNavigation,
        sliders: z.array(slider)
      })
    },
    handler: () => service().bootstrap()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/featured-cards",
    schemas: { response: z.array(featuredCard) },
    handler: () => service().featuredCards()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/promotions",
    schemas: { response: z.array(promotion) },
    handler: () => service().promotions()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/sliders",
    schemas: { response: z.array(slider) },
    handler: () => service().sliders()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/site-navigation",
    schemas: {
      response: siteNavigation.unwrap()
    },
    handler: () => service().siteNavigation()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/catalog",
    schemas: {
      querystring: z.object({
        brand: z.string().max(120).optional(),
        category: z.string().max(120).optional(),
        maxPrice: z.coerce.number().nonnegative().optional(),
        minPrice: z.coerce.number().nonnegative().optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
        scope: searchScope.optional(),
        search: z.string().max(120).optional(),
        sort: sort.optional()
      }),
      response: z.array(product)
    },
    handler: ({ query }) => service().catalog(query)
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/categories",
    schemas: {
      response: z.array(z.object({ name: z.string(), productCount: z.number() }))
    },
    handler: () => service().categories()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/discovery",
    schemas: {
      response: discovery
    },
    handler: () => service().discovery()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/storefront/products/:slug",
    schemas: {
      params: z.object({ slug: z.string().min(1).max(191) }),
      response: product.extend({
        bulletPoints: z.array(z.string()),
        returnPolicy: z.string(),
        variants: z.array(
          z.object({ id: z.number(), price: z.number(), sku: z.string(), title: z.string() })
        ),
        warranty: z.string()
      })
    },
    handler: async ({ params }) => {
      const result = await service().product(params.slug);
      if (!result) throw AppError.notFound("Storefront product was not found.");
      return result;
    }
  });
}
