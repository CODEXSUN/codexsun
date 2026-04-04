import {
  commonModuleKeySchema,
  type CommonModuleKey,
} from "../../../core/shared/index.js"
import { getBootstrapSnapshot } from "../../../core/src/services/bootstrap-service.js"
import {
  createCommonModuleItem,
  deleteCommonModuleItem,
  getCommonModuleItem,
  listCommonModuleItems,
  listCommonModuleMetadata,
  listCommonModuleSummaries,
  updateCommonModuleItem,
} from "../../../core/src/services/common-module-service.js"
import {
  createCompany,
  deleteCompany,
  getCompany,
  getPrimaryCompanyBrandProfile,
  listCompanies,
  updateCompany,
} from "../../../core/src/services/company-service.js"
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../../../core/src/services/product-service.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  getRuntimeSettingsSnapshot,
  resolveRuntimeSettingsRoot,
  saveRuntimeSettings,
} from "../../../framework/src/runtime/config/runtime-settings-service.js"
import { createContact, deleteContact, getContact, listContacts, updateContact } from "../../../core/src/services/contact-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { badRequestResponse, jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createCoreInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/core/bootstrap", {
      legacyPaths: ["/internal/core/bootstrap"],
      summary: "Core bootstrap mission, channels, and readiness snapshot.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getBootstrapSnapshot(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/runtime-settings", {
      summary: "Read runtime .env-backed settings exposed through the core settings page.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          getRuntimeSettingsSnapshot(resolveRuntimeSettingsRoot(context.config))
        )
      },
    }),
    defineInternalRoute("/core/runtime-settings", {
      method: "POST",
      summary: "Save runtime .env-backed settings and optionally restart the application.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await saveRuntimeSettings(
            context.request.jsonBody,
            resolveRuntimeSettingsRoot(context.config)
          )
        )
      },
    }),
    defineInternalRoute("/core/companies", {
      legacyPaths: ["/internal/core/companies"],
      summary: "Core company list used by shared organization setup surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listCompanies(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/company", {
      summary: "Read one core company by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const companyId = context.request.url.searchParams.get("id")

        if (!companyId) {
          throw new ApplicationError("Company id is required.", {}, 400)
        }

        return jsonResponse(await getCompany(context.databases.primary, user, companyId))
      },
    }),
    defineInternalRoute("/core/company-brand", {
      summary: "Read the primary company brand profile used by shell and public surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getPrimaryCompanyBrandProfile(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/companies", {
      method: "POST",
      summary: "Create a core company master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createCompany(context.databases.primary, user, context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/core/company", {
      method: "PATCH",
      summary: "Update a core company master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const companyId = context.request.url.searchParams.get("id")

        if (!companyId) {
          throw new ApplicationError("Company id is required.", {}, 400)
        }

        return jsonResponse(
          await updateCompany(
            context.databases.primary,
            user,
            companyId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/core/company", {
      method: "DELETE",
      summary: "Delete a core company master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const companyId = context.request.url.searchParams.get("id")

        if (!companyId) {
          throw new ApplicationError("Company id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteCompany(context.databases.primary, user, companyId)
        )
      },
    }),
    defineInternalRoute("/core/contacts", {
      legacyPaths: ["/internal/core/contacts"],
      summary: "Core contact list used by shared party and master-data surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listContacts(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/contact", {
      summary: "Read one core contact by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const contactId = context.request.url.searchParams.get("id")

        if (!contactId) {
          throw new ApplicationError("Contact id is required.", {}, 400)
        }

        return jsonResponse(await getContact(context.databases.primary, user, contactId))
      },
    }),
    defineInternalRoute("/core/contacts", {
      method: "POST",
      summary: "Create a core contact master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createContact(context.databases.primary, user, context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/core/contact", {
      method: "PATCH",
      summary: "Update a core contact master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const contactId = context.request.url.searchParams.get("id")

        if (!contactId) {
          throw new ApplicationError("Contact id is required.", {}, 400)
        }

        return jsonResponse(
          await updateContact(
            context.databases.primary,
            user,
            contactId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/core/contact", {
      method: "DELETE",
      summary: "Delete a core contact master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const contactId = context.request.url.searchParams.get("id")

        if (!contactId) {
          throw new ApplicationError("Contact id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteContact(context.databases.primary, user, contactId)
        )
      },
    }),
    defineInternalRoute("/core/products", {
      summary: "Core product list used by shared item and catalog master surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listProducts(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/product", {
      summary: "Read one core product master by id.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const productId = context.request.url.searchParams.get("id")

        if (!productId) {
          throw new ApplicationError("Product id is required.", {}, 400)
        }

        return jsonResponse(await getProduct(context.databases.primary, user, productId))
      },
    }),
    defineInternalRoute("/core/products", {
      method: "POST",
      summary: "Create a core product master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createProduct(context.databases.primary, user, context.request.jsonBody),
          201
        )
      },
    }),
    defineInternalRoute("/core/product", {
      method: "PATCH",
      summary: "Update a core product master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const productId = context.request.url.searchParams.get("id")

        if (!productId) {
          throw new ApplicationError("Product id is required.", {}, 400)
        }

        return jsonResponse(
          await updateProduct(
            context.databases.primary,
            user,
            productId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/core/product", {
      method: "DELETE",
      summary: "Delete a core product master.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const productId = context.request.url.searchParams.get("id")

        if (!productId) {
          throw new ApplicationError("Product id is required.", {}, 400)
        }

        return jsonResponse(
          await deleteProduct(context.databases.primary, user, productId)
        )
      },
    }),
    defineInternalRoute("/core/common-modules/metadata", {
      legacyPaths: ["/internal/core/common-modules/metadata"],
      summary: "Common module metadata registry for shared masters.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listCommonModuleMetadata(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/common-modules/summary", {
      legacyPaths: ["/internal/core/common-modules/summary"],
      summary: "Common module counts for workspace readiness and overview use.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listCommonModuleSummaries(context.databases.primary))
      },
    }),
    defineInternalRoute("/core/common-modules/items", {
      legacyPaths: ["/internal/core/common-modules/items"],
      summary: "Common module items for a selected shared master key.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const moduleKey = context.request.url.searchParams.get("module")
        const parsedKey = commonModuleKeySchema.safeParse(moduleKey)

        if (!parsedKey.success) {
          return badRequestResponse("A valid common module key is required.")
        }

        return jsonResponse(
          await listCommonModuleItems(
            context.databases.primary,
            parsedKey.data as CommonModuleKey
          )
        )
      },
    }),
    defineInternalRoute("/core/common-modules/item", {
      summary: "Read one common module record by module key and id.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const moduleKey = context.request.url.searchParams.get("module")
        const itemId = context.request.url.searchParams.get("id")
        const parsedKey = commonModuleKeySchema.safeParse(moduleKey)

        if (!parsedKey.success || !itemId) {
          return badRequestResponse("A valid common module key and record id are required.")
        }

        return jsonResponse(
          await getCommonModuleItem(context.databases.primary, parsedKey.data, itemId)
        )
      },
    }),
    defineInternalRoute("/core/common-modules/items", {
      method: "POST",
      summary: "Create one common module record for the selected shared master key.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const moduleKey = context.request.url.searchParams.get("module")
        const parsedKey = commonModuleKeySchema.safeParse(moduleKey)

        if (!parsedKey.success) {
          return badRequestResponse("A valid common module key is required.")
        }

        return jsonResponse(
          await createCommonModuleItem(
            context.databases.primary,
            parsedKey.data,
            context.request.jsonBody
          ),
          201
        )
      },
    }),
    defineInternalRoute("/core/common-modules/item", {
      method: "PATCH",
      summary: "Update one common module record for the selected shared master key.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const moduleKey = context.request.url.searchParams.get("module")
        const itemId = context.request.url.searchParams.get("id")
        const parsedKey = commonModuleKeySchema.safeParse(moduleKey)

        if (!parsedKey.success || !itemId) {
          return badRequestResponse("A valid common module key and record id are required.")
        }

        return jsonResponse(
          await updateCommonModuleItem(
            context.databases.primary,
            parsedKey.data,
            itemId,
            context.request.jsonBody
          )
        )
      },
    }),
    defineInternalRoute("/core/common-modules/item", {
      method: "DELETE",
      summary: "Delete one common module record for the selected shared master key.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const moduleKey = context.request.url.searchParams.get("module")
        const itemId = context.request.url.searchParams.get("id")
        const parsedKey = commonModuleKeySchema.safeParse(moduleKey)

        if (!parsedKey.success || !itemId) {
          return badRequestResponse("A valid common module key and record id are required.")
        }

        return jsonResponse(
          await deleteCommonModuleItem(context.databases.primary, parsedKey.data, itemId)
        )
      },
    }),
  ]
}
