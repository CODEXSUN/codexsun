import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  getRuntimeSettingsSnapshot,
  resolveRuntimeSettingsRoot,
  saveRuntimeSettings,
} from "../../../framework/src/runtime/config/runtime-settings-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import { getBootstrapSnapshot } from "../../../cxapp/src/services/bootstrap-service.js"
import {
  createCompany,
  deleteCompany,
  getCompany,
  getPrimaryCompanyBrandProfile,
  listCompanies,
  updateCompany,
} from "../../../cxapp/src/services/company-service.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createCxappInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/cxapp/bootstrap", {
      legacyPaths: ["/internal/core/bootstrap"],
      summary: "CxApp bootstrap mission, channels, and readiness snapshot.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getBootstrapSnapshot(context.databases.primary))
      },
    }),
    defineInternalRoute("/cxapp/runtime-settings", {
      legacyPaths: ["/internal/v1/core/runtime-settings"],
      summary: "Read runtime .env-backed settings exposed through the cxapp settings page.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          getRuntimeSettingsSnapshot(resolveRuntimeSettingsRoot(context.config))
        )
      },
    }),
    defineInternalRoute("/cxapp/runtime-settings", {
      method: "POST",
      legacyPaths: ["/internal/v1/core/runtime-settings"],
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
    defineInternalRoute("/cxapp/companies", {
      legacyPaths: ["/internal/core/companies"],
      summary: "CxApp company list used by shell branding and organization setup surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await listCompanies(context.databases.primary))
      },
    }),
    defineInternalRoute("/cxapp/company", {
      legacyPaths: ["/internal/v1/core/company"],
      summary: "Read one cxapp company by id.",
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
    defineInternalRoute("/cxapp/company-brand", {
      legacyPaths: ["/internal/v1/core/company-brand"],
      summary: "Read the primary company brand profile used by shell and public surfaces.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getPrimaryCompanyBrandProfile(context.databases.primary))
      },
    }),
    defineInternalRoute("/cxapp/companies", {
      method: "POST",
      legacyPaths: ["/internal/v1/core/companies"],
      summary: "Create a cxapp company master.",
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
    defineInternalRoute("/cxapp/company", {
      method: "PATCH",
      legacyPaths: ["/internal/v1/core/company"],
      summary: "Update a cxapp company master.",
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
    defineInternalRoute("/cxapp/company", {
      method: "DELETE",
      legacyPaths: ["/internal/v1/core/company"],
      summary: "Delete a cxapp company master.",
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
  ]
}
