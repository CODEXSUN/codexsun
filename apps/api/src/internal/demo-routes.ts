import {
  getDemoInstallJob,
  getDemoSummary,
  installDemoProfile,
  listDemoProfiles,
  startDemoInstallJob,
} from "../../../demo/src/services/demo-data-service.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

export function createDemoInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/demo/summary", {
      summary: "Read current suite data counts plus projected default and demo installer counts.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getDemoSummary(context.databases.primary))
      },
    }),
    defineInternalRoute("/demo/profiles", {
      summary: "List available demo-data installation profiles.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse({ items: await listDemoProfiles() })
      },
    }),
    defineInternalRoute("/demo/install", {
      method: "POST",
      summary: "Install the selected default or richer demo dataset into suite module tables.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await installDemoProfile(context.databases.primary, context.request.jsonBody)
        )
      },
    }),
    defineInternalRoute("/demo/job", {
      summary: "Read progress for a queued demo-data installation job.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const jobId = context.request.url.searchParams.get("id")

        if (!jobId) {
          return jsonResponse({ error: "Missing job id." }, 400)
        }

        return jsonResponse(await getDemoInstallJob(jobId))
      },
    }),
    defineInternalRoute("/demo/jobs", {
      method: "POST",
      summary: "Queue a demo-data installation job for a single module slice or full profile.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin"],
        })

        return jsonResponse(
          await startDemoInstallJob(context.databases.primary, context.request.jsonBody)
        )
      },
    }),
  ]
}
