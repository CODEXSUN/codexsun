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
      handler: () => jsonResponse(getBootstrapSnapshot()),
    }),
    defineInternalRoute("/core/companies", {
      legacyPaths: ["/internal/core/companies"],
      summary: "Core company list used by shared organization setup surfaces.",
      handler: () => jsonResponse(listCompanies()),
    }),
    defineInternalRoute("/core/contacts", {
      legacyPaths: ["/internal/core/contacts"],
      summary: "Core contact list used by shared party and master-data surfaces.",
      handler: () => jsonResponse(listContacts()),
    }),
    defineInternalRoute("/core/common-modules/metadata", {
      legacyPaths: ["/internal/core/common-modules/metadata"],
      summary: "Common module metadata registry for shared masters.",
      handler: () => jsonResponse(listCommonModuleMetadata()),
    }),
    defineInternalRoute("/core/common-modules/summary", {
      legacyPaths: ["/internal/core/common-modules/summary"],
      summary: "Common module counts for workspace readiness and overview use.",
      handler: () => jsonResponse(listCommonModuleSummaries()),
    }),
    defineInternalRoute("/core/common-modules/items", {
      legacyPaths: ["/internal/core/common-modules/items"],
      summary: "Common module items for a selected shared master key.",
      handler: ({ request }) => {
        const moduleKey = request.url.searchParams.get("module")
        const parsedKey = commonModuleKeySchema.safeParse(moduleKey)

        if (!parsedKey.success) {
          return badRequestResponse("A valid common module key is required.")
        }

        return jsonResponse(listCommonModuleItems(parsedKey.data as CommonModuleKey))
      },
    }),
  ]
}
