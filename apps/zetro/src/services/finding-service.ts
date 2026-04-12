import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import { zetroTableNames } from "../../database/table-names.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"
import type { ZetroSampleFinding } from "../../shared/index.js"
import {
  listStorePayloads,
  listStoreRecords,
  replaceStoreRecords,
} from "../data/query-database.js"

export type ZetroFindingStatus = ZetroSampleFinding["status"]

export type ZetroFinding = ZetroSampleFinding & {
  runId?: string
}

export type ZetroFindingFilters = {
  runId?: string
  status?: ZetroFindingStatus
}

export type ZetroCreateFindingInput = {
  id?: string
  runId?: string
  title: string
  category: ZetroFinding["category"]
  severity: ZetroFinding["severity"]
  confidence: number
  status?: ZetroFindingStatus
  summary: string
}

const zetroFindingCategories = new Set<ZetroFinding["category"]>([
  "bug",
  "test",
  "security",
  "type-design",
  "simplification",
  "convention",
  "ui",
  "architecture",
])
const zetroFindingSeverities = new Set<ZetroFinding["severity"]>([
  "critical",
  "high",
  "medium",
  "low",
  "info",
])
const zetroFindingStatuses = new Set<ZetroFindingStatus>([
  "open",
  "accepted",
  "dismissed",
  "fixed",
  "task-created",
])

function assertZetroFindingCategory(category: ZetroFinding["category"]) {
  if (!zetroFindingCategories.has(category)) {
    throw new ApplicationError(
      "Unsupported Zetro finding category.",
      { category },
      400
    )
  }
}

function assertZetroFindingSeverity(severity: ZetroFinding["severity"]) {
  if (!zetroFindingSeverities.has(severity)) {
    throw new ApplicationError(
      "Unsupported Zetro finding severity.",
      { severity },
      400
    )
  }
}

function assertZetroFindingStatus(status: ZetroFindingStatus) {
  if (!zetroFindingStatuses.has(status)) {
    throw new ApplicationError(
      "Unsupported Zetro finding status.",
      { status },
      400
    )
  }
}

function matchesFilters(finding: ZetroFinding, filters?: ZetroFindingFilters) {
  if (filters?.runId && finding.runId !== filters.runId) {
    return false
  }

  if (filters?.status && finding.status !== filters.status) {
    return false
  }

  return true
}

function normalizeCreateFindingInput(input: ZetroCreateFindingInput) {
  const title = input.title?.trim()
  const summary = input.summary?.trim()
  const status = input.status ?? "open"

  if (!title || !summary) {
    throw new ApplicationError(
      "Zetro finding title and summary are required.",
      {},
      400
    )
  }

  assertZetroFindingCategory(input.category)
  assertZetroFindingSeverity(input.severity)
  assertZetroFindingStatus(status)

  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 100) {
    throw new ApplicationError(
      "Zetro finding confidence must be between 0 and 100.",
      { confidence: input.confidence },
      400
    )
  }

  return {
    id: input.id?.trim() || `zetro-finding-${randomUUID()}`,
    runId: input.runId?.trim() || undefined,
    title,
    category: input.category,
    severity: input.severity,
    confidence: Math.round(input.confidence),
    status,
    summary,
  } satisfies ZetroFinding
}

export async function listZetroFindings(
  database: Kysely<unknown>,
  filters?: ZetroFindingFilters
) {
  const findings = await listStorePayloads<ZetroFinding>(
    database,
    zetroTableNames.findings
  )

  return findings.filter((finding) => matchesFilters(finding, filters))
}

export async function createZetroFinding(
  database: Kysely<unknown>,
  input: ZetroCreateFindingInput
) {
  const finding = normalizeCreateFindingInput(input)
  const records = await listStoreRecords<ZetroFinding>(
    database,
    zetroTableNames.findings
  )

  if (records.some((record) => record.id === finding.id)) {
    throw new ApplicationError(
      "Zetro finding id already exists.",
      { findingId: finding.id },
      409
    )
  }

  await replaceStoreRecords(database, zetroTableNames.findings, [
    ...records,
    {
      id: finding.id,
      moduleKey: finding.category,
      sortOrder: (records.at(-1)?.sortOrder ?? 0) + 10,
      payload: finding,
    },
  ])

  return finding
}

export async function updateZetroFindingStatus(
  database: Kysely<unknown>,
  findingId: string,
  status: ZetroFindingStatus
) {
  assertZetroFindingStatus(status)

  const records = await listStoreRecords<ZetroFinding>(
    database,
    zetroTableNames.findings
  )
  const target = records.find((record) => record.id === findingId)

  if (!target) {
    throw new ApplicationError(
      "Zetro finding could not be found.",
      { findingId },
      404
    )
  }

  const now = new Date().toISOString()
  const updatedFinding = {
    ...target.payload,
    status,
  } satisfies ZetroFinding

  await replaceStoreRecords(
    database,
    zetroTableNames.findings,
    records.map((record) => {
      if (record.id !== findingId) {
        return record
      }

      return {
        ...record,
        payload: updatedFinding,
        updatedAt: now,
      }
    })
  )

  return updatedFinding
}
