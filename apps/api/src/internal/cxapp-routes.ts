import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  getRuntimeSettingsSnapshot,
  resolveRuntimeSettingsRoot,
  saveRuntimeSettings,
} from "../../../framework/src/runtime/config/runtime-settings-service.js"
import { writeFrameworkActivityFromContext } from "../../../framework/src/runtime/activity-log/activity-log-service.js"
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
import {
  readCompanyBrandAssetDraft,
  saveCompanyBrandAssetDraft,
} from "../../../cxapp/src/services/company-brand-asset-draft-service.js"
import { publishCompanyBrandAssets } from "../../../cxapp/src/services/company-brand-assets-service.js"

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
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        const response = await saveRuntimeSettings(
          context.request.jsonBody,
          resolveRuntimeSettingsRoot(context.config)
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "settings",
          action: "runtime-settings.save",
          message: "Runtime settings were updated from the admin workspace.",
          details: {
            restartScheduled: response.restartScheduled,
          },
        })

        return jsonResponse(response)
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

        return jsonResponse(
          await getPrimaryCompanyBrandProfile(context.databases.primary, context.config)
        )
      },
    }),
    defineInternalRoute("/cxapp/company-brand-draft", {
      legacyPaths: ["/internal/v1/cxapp/company-brand-draft"],
      summary: "Read the temporary company logo designer draft for one company.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const companyId = context.request.url.searchParams.get("companyId")

        if (!companyId) {
          throw new ApplicationError("Company id is required.", {}, 400)
        }

        return jsonResponse(
          await readCompanyBrandAssetDraft(context.databases.primary, companyId)
        )
      },
    }),
    defineInternalRoute("/cxapp/company-brand-draft", {
      method: "PUT",
      legacyPaths: ["/internal/v1/cxapp/company-brand-draft"],
      summary: "Save the temporary company logo designer draft for one company.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })
        const companyId = context.request.url.searchParams.get("companyId")

        if (!companyId) {
          throw new ApplicationError("Company id is required.", {}, 400)
        }

        const response = await saveCompanyBrandAssetDraft(
          context.databases.primary,
          companyId,
          context.request.jsonBody
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "company-brand-assets.draft-save",
          message: "Company logo designer draft was saved.",
          details: {
            companyId,
            updatedAt: response.item.updatedAt,
          },
        })

        return jsonResponse(response)
      },
    }),
    defineInternalRoute("/cxapp/company-brand-assets/publish", {
      method: "POST",
      summary: "Publish selected company logo assets into managed public runtime branding files.",
      handler: async (context) => {
        const { user } = await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const response = await publishCompanyBrandAssets(
          context.databases.primary,
          context.config,
          context.request.jsonBody
        )

        await writeFrameworkActivityFromContext(context, user, {
          category: "operations",
          action: "company-brand-assets.publish",
          message: "Company brand SVG files were published from the company logo editor.",
          details: {
            format: response.item.format,
            publishedAt: response.item.publishedAt,
            backupPaths: response.item.backupPaths,
            publicUrls: response.item.publicUrls,
          },
        })

        return jsonResponse(response, 201)
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
