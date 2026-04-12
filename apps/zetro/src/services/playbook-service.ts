import type { Kysely } from "kysely"

import { zetroTableNames } from "../../database/table-names.js"
import type { ZetroPlaybook, ZetroPlaybookPhase } from "../../shared/index.js"
import {
  getStorePayloadById,
  listStorePayloads,
} from "../data/query-database.js"

export type ZetroStoredPlaybook = Omit<ZetroPlaybook, "phases">

export type ZetroStoredPlaybookPhase = ZetroPlaybookPhase & {
  playbookId: string
  sequence: number
}

export type ZetroPlaybookWithPhases = ZetroStoredPlaybook & {
  phases: ZetroStoredPlaybookPhase[]
}

function bySequence(left: ZetroStoredPlaybookPhase, right: ZetroStoredPlaybookPhase) {
  return left.sequence - right.sequence || left.id.localeCompare(right.id)
}

export async function listZetroPlaybooks(database: Kysely<unknown>) {
  const [playbooks, phases] = await Promise.all([
    listStorePayloads<ZetroStoredPlaybook>(database, zetroTableNames.playbooks),
    listStorePayloads<ZetroStoredPlaybookPhase>(
      database,
      zetroTableNames.playbookPhases
    ),
  ])

  return playbooks.map((playbook): ZetroPlaybookWithPhases => ({
    ...playbook,
    phases: phases
      .filter((phase) => phase.playbookId === playbook.id)
      .sort(bySequence),
  }))
}

export async function getZetroPlaybook(
  database: Kysely<unknown>,
  playbookId: string
) {
  const playbook = await getStorePayloadById<ZetroStoredPlaybook>(
    database,
    zetroTableNames.playbooks,
    playbookId
  )

  if (!playbook) {
    return null
  }

  const phases = await listStorePayloads<ZetroStoredPlaybookPhase>(
    database,
    zetroTableNames.playbookPhases,
    playbookId
  )

  return {
    ...playbook,
    phases: phases.sort(bySequence),
  } satisfies ZetroPlaybookWithPhases
}
