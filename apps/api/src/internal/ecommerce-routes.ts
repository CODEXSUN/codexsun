import {
  getStorefrontFooter,
  getStorefrontFloatingContact,
  getStorefrontPickupLocation,
  getStorefrontCouponBanner,
  getStorefrontGiftCorner,
  getStorefrontBrandShowcase,
  getStorefrontCampaign,
  getStorefrontTrendingSection,
  getStorefrontHomeSlider,
  getStorefrontSettings,
  saveStorefrontFooter,
  saveStorefrontFloatingContact,
  saveStorefrontPickupLocation,
  saveStorefrontCouponBanner,
  saveStorefrontGiftCorner,
  saveStorefrontBrandShowcase,
  saveStorefrontCampaign,
  saveStorefrontTrendingSection,
  saveStorefrontHomeSlider,
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
    defineInternalRoute("/ecommerce/home-slider", {
      summary: "Read ecommerce-owned home-slider design settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontHomeSlider(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/home-slider", {
      method: "PATCH",
      summary: "Update ecommerce-owned home-slider design settings used by the public hero.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontHomeSlider(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-footer", {
      summary: "Read ecommerce-owned storefront footer settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontFooter(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-footer", {
      method: "PATCH",
      summary: "Update ecommerce-owned storefront footer settings used by public surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontFooter(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-floating-contact", {
      summary: "Read ecommerce-owned floating-contact settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontFloatingContact(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-floating-contact", {
      method: "PATCH",
      summary: "Update ecommerce-owned floating-contact settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontFloatingContact(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-pickup-location", {
      summary: "Read ecommerce-owned pickup-location settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontPickupLocation(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-pickup-location", {
      method: "PATCH",
      summary: "Update ecommerce-owned pickup-location settings used by public storefront checkout surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontPickupLocation(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-coupon-banner", {
      summary: "Read ecommerce-owned coupon-banner settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontCouponBanner(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-coupon-banner", {
      method: "PATCH",
      summary: "Update ecommerce-owned coupon-banner settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontCouponBanner(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-gift-corner", {
      summary: "Read ecommerce-owned gift-corner settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontGiftCorner(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-gift-corner", {
      method: "PATCH",
      summary: "Update ecommerce-owned gift-corner settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontGiftCorner(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-trending-section", {
      summary: "Read ecommerce-owned trending-section settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontTrendingSection(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-trending-section", {
      method: "PATCH",
      summary: "Update ecommerce-owned trending-section settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontTrendingSection(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-brand-showcase", {
      summary: "Read ecommerce-owned brand-showcase settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontBrandShowcase(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-brand-showcase", {
      method: "PATCH",
      summary: "Update ecommerce-owned brand-showcase settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontBrandShowcase(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/ecommerce/storefront-campaign", {
      summary: "Read ecommerce-owned campaign and trust settings for the admin editor.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getStorefrontCampaign(context.databases.primary))
      },
    }),
    defineInternalRoute("/ecommerce/storefront-campaign", {
      method: "PATCH",
      summary: "Update ecommerce-owned campaign and trust settings used by public storefront surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveStorefrontCampaign(
            context.databases.primary,
            context.request.jsonBody
          )
        )
      },
    }),
  ]
}
