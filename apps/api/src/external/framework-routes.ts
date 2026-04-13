import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineExternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import { runRemoteControlledGitUpdate } from "../../../framework/src/runtime/operations/remote-server-control-service.js"
import { getLocalServerStatusSnapshot } from "../../../framework/src/runtime/operations/remote-server-status-service.js"

import { jsonResponse } from "../shared/http-responses.js"

export function createFrameworkExternalRoutes(): HttpRouteDefinition[] {
  return [
    defineExternalRoute("/framework/server-status", {
      auth: "none",
      summary: "Shared-secret protected remote server status payload for super-admin fleet monitoring.",
      handler: async (context) => {
        const expectedSecret = context.config.operations.serverMonitorSharedSecret?.trim()
        const suppliedSecret = context.request.headers["x-codexsun-monitor-key"]
        const normalizedSuppliedSecret = Array.isArray(suppliedSecret)
          ? suppliedSecret[0]?.trim()
          : suppliedSecret?.trim()

        if (!expectedSecret || normalizedSuppliedSecret !== expectedSecret) {
          throw new ApplicationError("Server monitor key is invalid.", {}, 401)
        }

        return jsonResponse(
          await getLocalServerStatusSnapshot(context.config, context.databases.primary)
        )
      },
    }),
    defineExternalRoute("/framework/server-control/git-update", {
      method: "POST",
      auth: "none",
      summary: "Shared-secret protected one-way git update trigger for remote runtime control.",
      handler: async (context) => {
        const expectedSecret = context.config.operations.serverMonitorSharedSecret?.trim()
        const suppliedSecret = context.request.headers["x-codexsun-monitor-key"]
        const normalizedSuppliedSecret = Array.isArray(suppliedSecret)
          ? suppliedSecret[0]?.trim()
          : suppliedSecret?.trim()

        if (!expectedSecret || normalizedSuppliedSecret !== expectedSecret) {
          throw new ApplicationError("Server monitor key is invalid.", {}, 401)
        }

        return jsonResponse(
          await runRemoteControlledGitUpdate(context.config, context.request.jsonBody, {
            actor: "remote-control",
          })
        )
      },
    }),
  ]
}
