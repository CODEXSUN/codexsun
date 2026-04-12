import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js"
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js"
import {
  appendZetroRunEvent,
  createZetroFinding,
  createZetroRun,
  getZetroDashboardSummary,
  getZetroPlaybook,
  getZetroRunWithDetails,
  listZetroFindings,
  listZetroGuardrails,
  listZetroPlaybooks,
  listZetroRuns,
  readZetroSettings,
  updateZetroFindingStatus,
  type ZetroCreateRunEventInput,
  type ZetroCreateFindingInput,
  type ZetroCreateRunInput,
  type ZetroFindingStatus,
} from "../../../zetro/src/services/index.js"

import { jsonResponse } from "../shared/http-responses.js"
import { requireAuthenticatedUser } from "../shared/session.js"

function requireQueryId(context: Parameters<HttpRouteDefinition["handler"]>[0], label: string) {
  const id = context.request.url.searchParams.get("id")?.trim()

  if (!id) {
    throw new ApplicationError(`${label} id is required.`, {}, 400)
  }

  return id
}

function requireJsonObject(context: Parameters<HttpRouteDefinition["handler"]>[0]) {
  const body = context.request.jsonBody

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApplicationError("JSON object request body is required.", {}, 400)
  }

  return body as Record<string, unknown>
}

export function createZetroInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/zetro/summary", {
      summary: "Read the persisted Zetro dashboard summary.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await getZetroDashboardSummary(context.databases.primary))
      },
    }),
    defineInternalRoute("/zetro/playbooks", {
      summary: "List persisted Zetro playbooks with phases.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse({
          items: await listZetroPlaybooks(context.databases.primary),
        })
      },
    }),
    defineInternalRoute("/zetro/playbook", {
      summary: "Read one persisted Zetro playbook by id.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const playbookId = requireQueryId(context, "Zetro playbook")
        const playbook = await getZetroPlaybook(context.databases.primary, playbookId)

        if (!playbook) {
          throw new ApplicationError(
            "Zetro playbook could not be found.",
            { playbookId },
            404
          )
        }

        return jsonResponse(playbook)
      },
    }),
    defineInternalRoute("/zetro/runs", {
      summary: "List persisted Zetro runs.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse({
          items: await listZetroRuns(context.databases.primary),
        })
      },
    }),
    defineInternalRoute("/zetro/run", {
      summary: "Read one persisted Zetro run with events and findings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const runId = requireQueryId(context, "Zetro run")
        const run = await getZetroRunWithDetails(context.databases.primary, runId)

        if (!run) {
          throw new ApplicationError("Zetro run could not be found.", { runId }, 404)
        }

        return jsonResponse(run)
      },
    }),
    defineInternalRoute("/zetro/runs", {
      method: "POST",
      summary: "Create a manual Zetro run without executing commands.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createZetroRun(
            context.databases.primary,
            requireJsonObject(context) as ZetroCreateRunInput
          ),
          201
        )
      },
    }),
    defineInternalRoute("/zetro/run/events", {
      method: "POST",
      summary: "Append a manual event to a Zetro run without executing commands.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const runId = requireQueryId(context, "Zetro run")

        return jsonResponse(
          await appendZetroRunEvent(
            context.databases.primary,
            runId,
            requireJsonObject(context) as ZetroCreateRunEventInput
          ),
          201
        )
      },
    }),
    defineInternalRoute("/zetro/findings", {
      summary: "List persisted Zetro findings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const runId = context.request.url.searchParams.get("runId") ?? undefined
        const status =
          (context.request.url.searchParams.get("status") as ZetroFindingStatus | null) ??
          undefined

        return jsonResponse({
          items: await listZetroFindings(context.databases.primary, {
            runId,
            status,
          }),
        })
      },
    }),
    defineInternalRoute("/zetro/findings", {
      method: "POST",
      summary: "Create a manual Zetro finding without executing commands.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(
          await createZetroFinding(
            context.databases.primary,
            requireJsonObject(context) as ZetroCreateFindingInput
          ),
          201
        )
      },
    }),
    defineInternalRoute("/zetro/finding", {
      method: "PATCH",
      summary: "Update one persisted Zetro finding status.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        const findingId = requireQueryId(context, "Zetro finding")
        const status = requireJsonObject(context).status as
          | ZetroFindingStatus
          | undefined

        if (!status) {
          throw new ApplicationError("Zetro finding status is required.", {}, 400)
        }

        return jsonResponse(
          await updateZetroFindingStatus(
            context.databases.primary,
            findingId,
            status
          )
        )
      },
    }),
    defineInternalRoute("/zetro/guardrails", {
      summary: "List persisted Zetro guardrails.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse({
          items: await listZetroGuardrails(context.databases.primary),
        })
      },
    }),
    defineInternalRoute("/zetro/settings", {
      summary: "Read persisted Zetro runtime and output-mode settings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        })

        return jsonResponse(await readZetroSettings(context.databases.primary))
      },
    }),
  ]
}
