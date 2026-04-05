import {
  getStorefrontSettings,
  saveStorefrontSettings,
} from "../../../ecommerce/src/services/storefront-settings-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createEcommerceInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/ecommerce/storefront-settings", {
      summary: "Read ecommerce-owned storefront settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontSettings(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-settings", {
      method: "PATCH",
      summary: "Update ecommerce-owned storefront settings used by public surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontSettings(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
  ]
}
