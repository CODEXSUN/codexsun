import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import { zetroTableNames } from "../../database/table-names.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import {
  zetroOutputModes,
  type ZetroOutputModeId,
  type ZetroSampleRun,
} from "../../shared/index.js"
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js"
import { listZetroFindings, type ZetroFinding } from "./finding-service.js"
import { getZetroPlaybook } from "./playbook-service.js"

export type ZetroRun = ZetroSampleRun

export type ZetroRunStatus = ZetroRun["status"]

export type ZetroRunEventKind =
  | "note"
  | "status"
  | "approval"
  | "finding"
  | "command-proposal"
  | "output"

export type ZetroRunEvent = {
  id: string
  runId: string
  sequence: number
  kind: ZetroRunEventKind
  summary: string
  detail?: string
  createdAt: string
}

export type ZetroRunWithDetails = ZetroRun & {
  events: ZetroRunEvent[]
  findings: ZetroFinding[]
}

export type ZetroCreateRunInput = {
  id?: string
  title: string
  playbookId: string
  status?: ZetroRunStatus
  outputMode?: ZetroOutputModeId
  summary: string
}

export type ZetroCreateRunEventInput = {
  id?: string
  kind?: ZetroRunEventKind
  summary: string
  detail?: string
}

const zetroRunStatuses = new Set<ZetroRunStatus>([
  "draft",
  "queued",
  "awaiting-approval",
  "running",
  "blocked",
  "completed",
  "failed",
  "cancelled",
])

const zetroRunEventKinds = new Set<ZetroRunEventKind>([
  "note",
  "status",
  "approval",
  "finding",
  "command-proposal",
  "output",
])
const zetroRunOutputModes = new Set<ZetroOutputModeId>(
  zetroOutputModes.map((mode) => mode.id)
)

function byEventSequence(left: ZetroRunEvent, right: ZetroRunEvent) {
  return left.sequence - right.sequence || left.id.localeCompare(right.id)
}

function assertRunStatus(status: ZetroRunStatus) {
  if (!zetroRunStatuses.has(status)) {
    throw new ApplicationError("Unsupported Zetro run status.", { status }, 400)
  }
}

function assertRunEventKind(kind: ZetroRunEventKind) {
  if (!zetroRunEventKinds.has(kind)) {
    throw new ApplicationError("Unsupported Zetro run event kind.", { kind }, 400)
  }
}

function normalizeRunInput(input: ZetroCreateRunInput) {
  const title = input.title?.trim()
  const playbookId = input.playbookId?.trim()
  const summary = input.summary?.trim()
  const status = input.status ?? "draft"

  if (!title || !playbookId || !summary) {
    throw new ApplicationError(
      "Zetro run title, playbookId, and summary are required.",
      {},
      400
    )
  }

  assertRunStatus(status)

  if (input.outputMode && !zetroRunOutputModes.has(input.outputMode)) {
    throw new ApplicationError(
      "Unsupported Zetro output mode.",
      { outputMode: input.outputMode },
      400
    )
  }

  return {
    id: input.id?.trim() || `zetro-run-${randomUUID()}`,
    title,
    playbookId,
    status,
    outputMode: input.outputMode,
    summary,
  }
}

function normalizeRunEventInput(input: ZetroCreateRunEventInput) {
  const summary = input.summary?.trim()
  const kind = input.kind ?? "note"

  if (!summary) {
    throw new ApplicationError("Zetro run event summary is required.", {}, 400)
  }

  assertRunEventKind(kind)

  return {
    id: input.id?.trim() || `zetro-event-${randomUUID()}`,
    kind,
    summary,
    detail: input.detail?.trim() || undefined,
  }
}

export async function listZetroRuns(database: Kysely<unknown>) {
  return listStorePayloads<ZetroRun>(database, zetroTableNames.runs)
}

export async function listZetroRunEvents(
  database: Kysely<unknown>,
  runId?: string
) {
  const events = await listStorePayloads<ZetroRunEvent>(
    database,
    zetroTableNames.runEvents
  )

  return events
    .filter((event) => !runId || event.runId === runId)
    .sort(byEventSequence)
}

export async function getZetroRun(database: Kysely<unknown>, runId: string) {
  const runs = await listZetroRuns(database)

  return runs.find((run) => run.id === runId) ?? null
}

export async function getZetroRunWithDetails(
  database: Kysely<unknown>,
  runId: string
) {
  const [run, events, findings] = await Promise.all([
    getZetroRun(database, runId),
    listZetroRunEvents(database, runId),
    listZetroFindings(database, { runId }),
  ])

  if (!run) {
    return null
  }

  return {
    ...run,
    events,
    findings,
  } satisfies ZetroRunWithDetails
}

export async function createZetroRun(
  database: Kysely<unknown>,
  input: ZetroCreateRunInput
) {
  const normalizedInput = normalizeRunInput(input)
  const playbook = await getZetroPlaybook(database, normalizedInput.playbookId)

  if (!playbook) {
    throw new ApplicationError(
      "Zetro playbook could not be found.",
      { playbookId: normalizedInput.playbookId },
      404
    )
  }

  const records = await listStoreRecords<ZetroRun>(database, zetroTableNames.runs)

  if (records.some((record) => record.id === normalizedInput.id)) {
    throw new ApplicationError(
      "Zetro run id already exists.",
      { runId: normalizedInput.id },
      409
    )
  }

  const run = {
    id: normalizedInput.id,
    title: normalizedInput.title,
    playbookId: normalizedInput.playbookId,
    status: normalizedInput.status,
    outputMode: normalizedInput.outputMode ?? playbook.defaultOutputMode,
    summary: normalizedInput.summary,
  } satisfies ZetroRun

  await replaceStoreRecords(database, zetroTableNames.runs, [
    ...records,
    {
      id: run.id,
      moduleKey: run.status,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: run,
    },
  ])

  return run
}

export async function appendZetroRunEvent(
  database: Kysely<unknown>,
  runId: string,
  input: ZetroCreateRunEventInput
) {
  const run = await getZetroRun(database, runId)

  if (!run) {
    throw new ApplicationError("Zetro run could not be found.", { runId }, 404)
  }

  const normalizedInput = normalizeRunEventInput(input)
  const records = await listStoreRecords<ZetroRunEvent>(
    database,
    zetroTableNames.runEvents
  )

  if (records.some((record) => record.id === normalizedInput.id)) {
    throw new ApplicationError(
      "Zetro run event id already exists.",
      { eventId: normalizedInput.id },
      409
    )
  }

  const runEvents = records
    .map((record) => record.payload)
    .filter((event) => event.runId === runId)
  const lastSequence = Math.max(0, ...runEvents.map((event) => event.sequence))
  const event = {
    id: normalizedInput.id,
    runId,
    sequence: lastSequence + 1,
    kind: normalizedInput.kind,
    summary: normalizedInput.summary,
    detail: normalizedInput.detail,
    createdAt: new Date().toISOString(),
  } satisfies ZetroRunEvent

  await replaceStoreRecords(database, zetroTableNames.runEvents, [
    ...records,
    {
      id: event.id,
      moduleKey: runId,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: event,
    },
  ])

  return event
}
