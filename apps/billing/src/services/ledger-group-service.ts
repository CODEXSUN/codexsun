import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  billingLedgerGroupListResponseSchema,
  billingLedgerGroupResponseSchema,
  billingLedgerGroupSchema,
  billingLedgerGroupUpsertPayloadSchema,
  billingLedgerSchema,
} from "../../shared/index.js"
import type { AuthUser } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

type StoredLedgerGroup = {
  description: string
  id: string
  name: string
}

const storedBillingLedgerGroupSchema = billingLedgerGroupSchema
  .pick({
    description: true,
    id: true,
    name: true,
  })

async function readLedgerGroups(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.ledgerGroups,
    storedBillingLedgerGroupSchema
  )
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

function deriveLedgerGroupsFromLedgers(ledgers: Awaited<ReturnType<typeof readLedgers>>) {
  return Array.from(new Set(ledgers.map((ledger) => ledger.group))).map((groupName) =>
    storedBillingLedgerGroupSchema.parse({
      id: `ledger-group:seed:${groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: groupName,
      description: "",
    })
  )
}

function toLedgerGroupWithCounts(
  groups: StoredLedgerGroup[],
  ledgers: Awaited<ReturnType<typeof readLedgers>>
) {
  return groups.map((group) =>
    billingLedgerGroupSchema.parse({
      ...group,
      linkedLedgerCount: ledgers.filter((ledger) => ledger.group === group.name).length,
    })
  )
}

export async function listBillingLedgerGroups(database: Kysely<unknown>) {
  const [groups, ledgers] = await Promise.all([
    readLedgerGroups(database),
    readLedgers(database),
  ])
  const effectiveGroups = groups.length > 0 ? groups : deriveLedgerGroupsFromLedgers(ledgers)

  return billingLedgerGroupListResponseSchema.parse({
    items: toLedgerGroupWithCounts(effectiveGroups, ledgers),
  })
}

export async function createBillingLedgerGroup(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingLedgerGroupUpsertPayloadSchema.parse(payload)
  const [groups, ledgers] = await Promise.all([
    readLedgerGroups(database),
    readLedgers(database),
  ])
  const effectiveGroups = groups.length > 0 ? groups : deriveLedgerGroupsFromLedgers(ledgers)
  const duplicate = groups.find(
    (group) => group.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (!duplicate) {
    const derivedDuplicate = effectiveGroups.find(
      (group) => group.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
    )

    if (derivedDuplicate) {
      throw new ApplicationError(
        "Ledger group name already exists.",
        { name: parsedPayload.name },
        409
      )
    }
  }

  if (duplicate) {
    throw new ApplicationError(
      "Ledger group name already exists.",
      { name: parsedPayload.name },
      409
    )
  }

  const item = storedBillingLedgerGroupSchema.parse({
    id: `ledger-group:${randomUUID()}`,
    name: parsedPayload.name,
    description: parsedPayload.description,
  })

  await replaceStorePayloads(database, billingTableNames.ledgerGroups, [
    ...effectiveGroups.map((group) => ({
      id: group.id,
      moduleKey: "billing/ledger-groups",
      payload: group,
    })),
    {
      id: item.id,
      moduleKey: "billing/ledger-groups",
      payload: item,
    },
  ])

  return billingLedgerGroupResponseSchema.parse({
    item: {
      ...item,
      linkedLedgerCount: 0,
    },
  })
}
