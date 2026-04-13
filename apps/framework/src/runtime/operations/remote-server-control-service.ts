import type { Kysely } from "kysely"

import {
  remoteGitUpdateRequestSchema,
  remoteGitUpdateResponseSchema,
  type RemoteGitUpdateResponse,
} from "../../../shared/remote-server-control.js"
import type { ServerConfig } from "../config/server-config.js"
import { ApplicationError } from "../errors/application-error.js"
import {
  type CommandRunner,
  getSystemUpdateStatus,
  runSystemUpdate,
} from "../system-update/system-update-service.js"
import { getRemoteServerTarget } from "./remote-server-status-service.js"

type RemoteStatusFetch = (input: string, init?: RequestInit) => Promise<Response>

export async function runRemoteControlledGitUpdate(
  config: ServerConfig,
  payload: unknown,
  options: {
    actor?: string | null
    commandRunner?: CommandRunner
    getStatus?: typeof getSystemUpdateStatus
    runUpdate?: typeof runSystemUpdate
  } = {}
): Promise<RemoteGitUpdateResponse> {
  const parsed = remoteGitUpdateRequestSchema.parse(payload)
  const getStatus = options.getStatus ?? getSystemUpdateStatus
  const runUpdate = options.runUpdate ?? runSystemUpdate
  const beforeStatus = await getStatus(config, options.commandRunner)

  if (!beforeStatus.canAutoUpdate) {
    throw new ApplicationError(
      "Remote git update is not available because this runtime is not ready for one-way git sync.",
      {
        issues: beforeStatus.preflight.issues,
      },
      409
    )
  }

  if (!beforeStatus.isClean && !parsed.overrideDirty) {
    throw new ApplicationError(
      "Remote git update was blocked because the runtime worktree is dirty. Retry with overrideDirty=true to discard local drift.",
      {
        localChanges: beforeStatus.localChanges,
      },
      409
    )
  }

  const update = await runUpdate(
    config,
    options.commandRunner,
    options.actor ?? "remote-control"
  )

  return remoteGitUpdateResponseSchema.parse({
    mode: beforeStatus.isClean ? "clean_update" : "override_dirty_update",
    overrideDirty: parsed.overrideDirty,
    beforeStatus,
    update,
  })
}

export async function triggerRemoteServerGitUpdate(
  config: ServerConfig,
  database: Kysely<unknown>,
  targetId: string,
  payload: unknown,
  options: {
    fetcher?: RemoteStatusFetch
  } = {}
) {
  const parsed = remoteGitUpdateRequestSchema.parse(payload)
  const target = (await getRemoteServerTarget(database, targetId)).item
  const fetcher = options.fetcher ?? fetch

  if (!target.isActive) {
    throw new ApplicationError("Remote server target is inactive.", { targetId }, 409)
  }

  if (!target.monitorSecret?.trim()) {
    throw new ApplicationError(
      "Remote server target does not have a saved monitor secret.",
      { targetId },
      409
    )
  }

  const response = await fetcher(`${target.baseUrl}/api/v1/framework/server-control/git-update`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      "x-codexsun-monitor-key": target.monitorSecret,
    },
    body: JSON.stringify(parsed),
  })

  const payloadData = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | RemoteGitUpdateResponse
    | null

  if (!response.ok) {
    throw new ApplicationError(
      payloadData && "error" in payloadData
        ? payloadData.error ?? payloadData.message ?? `Remote server returned HTTP ${response.status}.`
        : `Remote server returned HTTP ${response.status}.`,
      {
        targetId,
        statusCode: response.status,
      },
      response.status >= 400 && response.status < 500 ? response.status : 502
    )
  }

  return remoteGitUpdateResponseSchema.parse(payloadData)
}
