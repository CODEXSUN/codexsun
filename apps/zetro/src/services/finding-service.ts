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

const zetroFindingStatuses = new Set<ZetroFindingStatus>([
  "open",
  "accepted",
  "dismissed",
  "fixed",
  "task-created",
])

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
