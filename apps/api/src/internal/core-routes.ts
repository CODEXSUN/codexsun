import {
  commonModuleKeySchema,
  type CommonModuleKey,
} from "../../../core/shared/index.js"
import { getBootstrapSnapshot } from "../../../core/src/services/bootstrap-service.js"
import { listCommonModuleItems, listCommonModuleMetadata, listCommonModuleSummaries } from "../../../core/src/services/common-module-service.js"
import { listCompanies } from "../../../core/src/services/company-service.js"
import { listContacts } from "../../../core/src/services/contact-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { badRequestResponse, jsonResponse } from "../shared/http-responses.js"

export function createCoreInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/core/bootstrap", {
      legacyPaths: ["/internal/core/bootstrap"],
      summary: "Core bootstrap mission, channels, and readiness snapshot.",
      handler: async ({ databases }) =>
        jsonResponse(await getBootstrapSnapshot(databases.primary)),
    }),
    defineInternalRoute("/core/companies", {
      legacyPaths: ["/internal/core/companies"],
      summary: "Core company list used by shared organization setup surfaces.",
      handler: async ({ databases }) =>
        jsonResponse(await listCompanies(databases.primary)),
    }),
    defineInternalRoute("/core/contacts", {
      legacyPaths: ["/internal/core/contacts"],
      summary: "Core contact list used by shared party and master-data surfaces.",
      handler: async ({ databases }) =>
        jsonResponse(await listContacts(databases.primary)),
    }),
    defineInternalRoute("/core/common-modules/metadata", {
      legacyPaths: ["/internal/core/common-modules/metadata"],
      summary: "Common module metadata registry for shared masters.",
      handler: async ({ databases }) =>
        jsonResponse(await listCommonModuleMetadata(databases.primary)),
    }),
    defineInternalRoute("/core/common-modules/summary", {
      legacyPaths: ["/internal/core/common-modules/summary"],
      summary: "Common module counts for workspace readiness and overview use.",
      handler: async ({ databases }) =>
        jsonResponse(await listCommonModuleSummaries(databases.primary)),
    }),
    defineInternalRoute("/core/common-modules/items", {
      legacyPaths: ["/internal/core/common-modules/items"],
      summary: "Common module items for a selected shared master key.",
      handler: async ({ databases, request }) => {
        const moduleKey = request.url.searchParams.get("module")
        const parsedKey = commonModuleKeySchema.safeParse(moduleKey)

        if (!parsedKey.success) {
          return badRequestResponse("A valid common module key is required.")
        }

        return jsonResponse(
          await listCommonModuleItems(
            databases.primary,
            parsedKey.data as CommonModuleKey
          )
        )
      },
    }),
  ]
}
