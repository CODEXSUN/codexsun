import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  billingVoucherGroupListResponseSchema,
  billingVoucherGroupResponseSchema,
  billingVoucherGroupSchema,
  billingVoucherGroupUpsertPayloadSchema,
  billingVoucherMasterTypeSchema,
} from "../../shared/index.js"
import type { AuthUser } from "../../../core/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

type StoredBillingVoucherGroup = {
  deletedAt: string | null
  description: string
  id: string
  name: string
}

const storedBillingVoucherGroupSchema = billingVoucherGroupSchema.pick({
  deletedAt: true,
  description: true,
  id: true,
  name: true,
})

const storedBillingVoucherTypeSchema = billingVoucherMasterTypeSchema
  .pick({
    categoryId: true,
    categoryName: true,
    deletedAt: true,
    description: true,
    id: true,
    ledgerId: true,
    ledgerName: true,
    name: true,
    postingType: true,
    voucherGroupId: true,
    voucherGroupName: true,
  })
  .partial({
    categoryId: true,
    categoryName: true,
    ledgerId: true,
    ledgerName: true,
  })

async function readVoucherGroups(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.voucherGroups,
    storedBillingVoucherGroupSchema
  )
}

async function readVoucherTypes(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.voucherTypes,
    storedBillingVoucherTypeSchema
  )
}

function toVoucherGroupsWithCounts(
  groups: StoredBillingVoucherGroup[],
  types: Awaited<ReturnType<typeof readVoucherTypes>>
) {
  return groups.map((group) =>
    billingVoucherGroupSchema.parse({
      ...group,
      linkedVoucherTypeCount: types.filter((type) => type.voucherGroupId === group.id).length,
    })
  )
}

export async function listBillingVoucherGroups(database: Kysely<unknown>) {
  const [groups, types] = await Promise.all([
    readVoucherGroups(database),
    readVoucherTypes(database),
  ])

  return billingVoucherGroupListResponseSchema.parse({
    items: toVoucherGroupsWithCounts(groups, types),
  })
}

export async function createBillingVoucherGroup(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherGroupUpsertPayloadSchema.parse(payload)
  const groups = await readVoucherGroups(database)
  const duplicate = groups.find(
    (group) => group.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError("Billing voucher group name already exists.", { name: parsedPayload.name }, 409)
  }

  const item = storedBillingVoucherGroupSchema.parse({
    id: `billing-voucher-group:${randomUUID()}`,
    name: parsedPayload.name,
    description: parsedPayload.description,
    deletedAt: null,
  })

  await replaceStorePayloads(database, billingTableNames.voucherGroups, [
    ...groups.map((group) => ({
      id: group.id,
      moduleKey: "billing/voucher-groups",
      payload: group,
    })),
    {
      id: item.id,
      moduleKey: "billing/voucher-groups",
      payload: item,
    },
  ])

  return billingVoucherGroupResponseSchema.parse({
    item: {
      ...item,
      linkedVoucherTypeCount: 0,
    },
  })
}

export async function updateBillingVoucherGroup(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherGroupId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherGroupUpsertPayloadSchema.parse(payload)
  const [groups, types] = await Promise.all([
    readVoucherGroups(database),
    readVoucherTypes(database),
  ])
  const existing = groups.find((group) => group.id === voucherGroupId)

  if (!existing) {
    throw new ApplicationError("Billing voucher group was not found.", { voucherGroupId }, 404)
  }

  const duplicate = groups.find(
    (group) =>
      group.id !== voucherGroupId &&
      group.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError("Billing voucher group name already exists.", { name: parsedPayload.name }, 409)
  }

  const updatedGroup = storedBillingVoucherGroupSchema.parse({
    id: existing.id,
    name: parsedPayload.name,
    description: parsedPayload.description,
    deletedAt: existing.deletedAt,
  })

  await replaceStorePayloads(
    database,
    billingTableNames.voucherGroups,
    groups.map((group) => ({
      id: group.id,
      moduleKey: "billing/voucher-groups",
      payload: group.id === voucherGroupId ? updatedGroup : group,
    }))
  )

  await replaceStorePayloads(
    database,
    billingTableNames.voucherTypes,
    types.map((type) => ({
      id: type.id,
      moduleKey: "billing/voucher-types",
      payload:
        type.voucherGroupId === voucherGroupId
          ? {
              ...type,
              voucherGroupName: updatedGroup.name,
            }
          : type,
    }))
  )

  return billingVoucherGroupResponseSchema.parse({
    item: {
      ...updatedGroup,
      linkedVoucherTypeCount: types.filter((type) => type.voucherGroupId === voucherGroupId).length,
    },
  })
}

export async function deleteBillingVoucherGroup(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherGroupId: string
) {
  assertBillingViewer(user)

  const [groups, types] = await Promise.all([
    readVoucherGroups(database),
    readVoucherTypes(database),
  ])
  const existing = groups.find((group) => group.id === voucherGroupId)

  if (!existing) {
    throw new ApplicationError("Billing voucher group was not found.", { voucherGroupId }, 404)
  }

  if (existing.deletedAt) {
    return { deleted: true as const, id: voucherGroupId }
  }

  if (types.some((type) => type.voucherGroupId === voucherGroupId && !type.deletedAt)) {
    throw new ApplicationError(
      "Billing voucher group cannot be deleted while voucher types are still active.",
      { voucherGroupId },
      409
    )
  }

  const deletedAt = new Date().toISOString()

  await replaceStorePayloads(
    database,
    billingTableNames.voucherGroups,
    groups.map((group) => ({
      id: group.id,
      moduleKey: "billing/voucher-groups",
      payload: group.id === voucherGroupId ? { ...group, deletedAt } : group,
    }))
  )

  return { deleted: true as const, id: voucherGroupId }
}

export async function restoreBillingVoucherGroup(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherGroupId: string
) {
  assertBillingViewer(user)

  const [groups, types] = await Promise.all([
    readVoucherGroups(database),
    readVoucherTypes(database),
  ])
  const existing = groups.find((group) => group.id === voucherGroupId)

  if (!existing) {
    throw new ApplicationError("Billing voucher group was not found.", { voucherGroupId }, 404)
  }

  await replaceStorePayloads(
    database,
    billingTableNames.voucherGroups,
    groups.map((group) => ({
      id: group.id,
      moduleKey: "billing/voucher-groups",
      payload: group.id === voucherGroupId ? { ...group, deletedAt: null } : group,
    }))
  )

  return billingVoucherGroupResponseSchema.parse({
    item: {
      ...existing,
      deletedAt: null,
      linkedVoucherTypeCount: types.filter((type) => type.voucherGroupId === voucherGroupId).length,
    },
  })
}
