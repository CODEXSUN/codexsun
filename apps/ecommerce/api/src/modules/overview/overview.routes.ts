import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import type {} from "@codexsun/framework/api";
import { EcommerceOverviewService } from "./overview.service.js";
import type { EcommerceOverviewRequestContext } from "./overview.types.js";
import {
  assertLocalStorefrontControl,
  EcommerceStorefrontRuntime
} from "./overview.storefront-runtime.js";

const overviewSchema = z.object({
  actorEmail: z.string(),
  appKey: z.literal("ecommerce"),
  checkedAt: z.string(),
  label: z.string(),
  tenantCode: z.string(),
  tenantName: z.string()
});

export function registerEcommerceOverviewRoutes(
  app: FastifyInstance,
  context: (request: FastifyRequest) => Promise<EcommerceOverviewRequestContext>
) {
  const runtime = new EcommerceStorefrontRuntime();
  app.addHook("onClose", async () => runtime.close());
  const runtimeSchema = z.object({
    state: z.enum(["running", "starting", "stopped", "unavailable", "unhealthy"]),
    port: z.number().nullable()
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/ecommerce/overview/storefront-runtime",
    schemas: { response: runtimeSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("ecommerce.overview.view");
      assertLocalStorefrontControl(request);
      return runtime.status(request.headers.cookie);
    }
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/ecommerce/overview/storefront-runtime/start",
    schemas: { response: runtimeSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("ecommerce.storefront.manage");
      const result = await runtime.start(request);
      request.log.info(
        {
          actorEmail: scope.actorEmail,
          tenant: scope.tenant.code,
          action: "ecommerce.storefront.start",
          state: result.state
        },
        "Storefront runtime start requested"
      );
      return result;
    }
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/ecommerce/overview",
    schemas: { response: overviewSchema },
    handler: async ({ request }) => {
      const scope = await context(request);
      await scope.authorize("ecommerce.overview.view");
      return new EcommerceOverviewService(scope).getOverview();
    }
  });
}
