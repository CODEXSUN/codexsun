import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  billingCategorySchema,
  billingVoucherGroupSchema,
  billingLedgerSchema,
  billingVoucherMasterTypeListResponseSchema,
  billingVoucherMasterTypeResponseSchema,
  billingVoucherMasterTypeSchema,
  billingVoucherMasterTypeUpsertPayloadSchema,
} from "../../shared/index.js"
import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

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

type StoredBillingVoucherType = Awaited<
  ReturnType<typeof storedBillingVoucherTypeSchema.parse>
>

function resolvePostingTypeFromVoucherGroupName(name: string) {
  const normalizedName = name.trim().toLowerCase()

  switch (normalizedName) {
    case "sales":
      return "sales" as const
    case "sales return":
    case "sales-return":
    case "sales_return":
      return "sales_return" as const
    case "credit note":
    case "credit-note":
    case "credit_note":
      return "credit_note" as const
    case "purchase":
      return "purchase" as const
    case "purchase return":
    case "purchase-return":
    case "purchase_return":
      return "purchase_return" as const
    case "debit note":
    case "debit-note":
    case "debit_note":
      return "debit_note" as const
    case "stock adjustment":
    case "stock-adjustment":
    case "stock_adjustment":
      return "stock_adjustment" as const
    case "landed cost":
    case "landed-cost":
    case "landed_cost":
      return "landed_cost" as const
    case "receipt":
      return "receipt" as const
    case "payment":
      return "payment" as const
    case "contra":
      return "contra" as const
    case "journal":
      return "journal" as const
    default:
      return null
  }
}

function resolveDefaultCategoryNameFromPostingType(
  postingType:
    | "payment"
    | "receipt"
    | "sales"
    | "sales_return"
    | "credit_note"
    | "purchase"
    | "purchase_return"
    | "debit_note"
    | "stock_adjustment"
    | "landed_cost"
    | "contra"
    | "journal"
) {
  switch (postingType) {
    case "sales":
      return "Income"
    case "sales_return":
      return "Income"
    case "credit_note":
    case "purchase":
    case "purchase_return":
    case "debit_note":
    case "stock_adjustment":
    case "landed_cost":
      return "Expenses"
    case "payment":
    case "receipt":
    case "contra":
    case "journal":
      return "Assets"
  }
}

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

async function readCategories(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.categories,
    billingCategorySchema.pick({
      deletedAt: true,
      description: true,
      id: true,
      name: true,
      nature: true,
    })
  )
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

function normalizeStoredVoucherType(
  type: StoredBillingVoucherType,
  categories: Awaited<ReturnType<typeof readCategories>>,
  ledgers: Awaited<ReturnType<typeof readLedgers>>
) {
  const directLedger =
    (type.ledgerId ? ledgers.find((ledger) => ledger.id === type.ledgerId) : null) ?? null
  const directCategory =
    (type.categoryId
      ? categories.find((category) => category.id === type.categoryId)
      : null) ?? null
  const inferredCategory =
    directCategory ??
    (directLedger
      ? categories.find((category) => category.id === directLedger.categoryId) ?? null
      : categories.find(
          (category) =>
            category.name.trim().toLowerCase() ===
            resolveDefaultCategoryNameFromPostingType(type.postingType).toLowerCase()
        ) ?? null)
  const inferredLedger =
    directLedger ??
    (inferredCategory
      ? ledgers.find(
          (ledger) =>
            ledger.categoryId === inferredCategory.id &&
            ledger.name.trim().toLowerCase().includes(type.postingType)
        ) ??
        ledgers.find((ledger) => ledger.categoryId === inferredCategory.id) ??
        null
      : null)

  if (!inferredCategory || !inferredLedger) {
    throw new ApplicationError(
      "Billing voucher type is missing category or ledger alignment.",
      { voucherTypeId: type.id },
      500
    )
  }

  return billingVoucherMasterTypeSchema.parse({
    ...type,
    categoryId: inferredCategory.id,
    categoryName: inferredCategory.name,
    ledgerId: inferredLedger.id,
    ledgerName: inferredLedger.name,
  })
}

export async function listBillingVoucherTypes(database: Kysely<unknown>) {
  const [items, categories, ledgers] = await Promise.all([
    readVoucherTypes(database),
    readCategories(database),
    readLedgers(database),
  ])

  return billingVoucherMasterTypeListResponseSchema.parse({
    items: items.map((item) => normalizeStoredVoucherType(item, categories, ledgers)),
  })
}

export async function createBillingVoucherType(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherMasterTypeUpsertPayloadSchema.parse(payload)
  const [groups, storedTypes, categories, ledgers] = await Promise.all([
    readVoucherGroups(database),
    readVoucherTypes(database),
    readCategories(database),
    readLedgers(database),
  ])
  const types = storedTypes.map((type) => normalizeStoredVoucherType(type, categories, ledgers))
  const duplicate = types.find(
    (type) => type.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError("Billing voucher type name already exists.", { name: parsedPayload.name }, 409)
  }

  const group = groups.find((entry) => entry.id === parsedPayload.voucherGroupId)

  if (!group) {
    throw new ApplicationError("Billing voucher group could not be found.", { voucherGroupId: parsedPayload.voucherGroupId }, 404)
  }

  if (group.deletedAt) {
    throw new ApplicationError("Billing voucher group is deleted and cannot be used for voucher types.", { voucherGroupId: parsedPayload.voucherGroupId }, 409)
  }

  const category = categories.find((entry) => entry.id === parsedPayload.categoryId)

  if (!category) {
    throw new ApplicationError("Billing category could not be found.", { categoryId: parsedPayload.categoryId }, 404)
  }

  if (category.deletedAt) {
    throw new ApplicationError("Billing category is deleted and cannot be used for voucher types.", { categoryId: parsedPayload.categoryId }, 409)
  }

  const ledger = ledgers.find((entry) => entry.id === parsedPayload.ledgerId)

  if (!ledger) {
    throw new ApplicationError("Billing ledger could not be found.", { ledgerId: parsedPayload.ledgerId }, 404)
  }

  if (ledger.categoryId !== category.id) {
    throw new ApplicationError(
      "Voucher type ledger must belong to the selected billing category.",
      { categoryId: category.id, ledgerId: ledger.id },
      400
    )
  }

  const postingType = resolvePostingTypeFromVoucherGroupName(group.name)

  if (!postingType) {
    throw new ApplicationError(
      "Selected voucher group does not map to a supported posting type.",
      { voucherGroupId: parsedPayload.voucherGroupId, voucherGroupName: group.name },
      400
    )
  }

  const item = storedBillingVoucherTypeSchema.parse({
    id: `billing-voucher-type:${randomUUID()}`,
    name: parsedPayload.name,
    categoryId: category.id,
    categoryName: category.name,
    ledgerId: ledger.id,
    ledgerName: ledger.name,
    voucherGroupId: group.id,
    voucherGroupName: group.name,
    postingType,
    description: parsedPayload.description,
    deletedAt: null,
  })

  await replaceStorePayloads(database, billingTableNames.voucherTypes, [
    ...types.map((type) => ({
      id: type.id,
      moduleKey: "billing/voucher-types",
      payload: type,
    })),
    {
      id: item.id,
      moduleKey: "billing/voucher-types",
      payload: item,
    },
  ])

  return billingVoucherMasterTypeResponseSchema.parse({ item })
}

export async function updateBillingVoucherType(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherTypeId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingVoucherMasterTypeUpsertPayloadSchema.parse(payload)
  const [groups, storedTypes, categories, ledgers] = await Promise.all([
    readVoucherGroups(database),
    readVoucherTypes(database),
    readCategories(database),
    readLedgers(database),
  ])
  const types = storedTypes.map((type) => normalizeStoredVoucherType(type, categories, ledgers))
  const existing = types.find((type) => type.id === voucherTypeId)

  if (!existing) {
    throw new ApplicationError("Billing voucher type could not be found.", { voucherTypeId }, 404)
  }

  const duplicate = types.find(
    (type) =>
      type.id !== voucherTypeId &&
      type.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError("Billing voucher type name already exists.", { name: parsedPayload.name }, 409)
  }

  const group = groups.find((entry) => entry.id === parsedPayload.voucherGroupId)

  if (!group) {
    throw new ApplicationError("Billing voucher group could not be found.", { voucherGroupId: parsedPayload.voucherGroupId }, 404)
  }

  if (group.deletedAt) {
    throw new ApplicationError("Billing voucher group is deleted and cannot be used for voucher types.", { voucherGroupId: parsedPayload.voucherGroupId }, 409)
  }

  const category = categories.find((entry) => entry.id === parsedPayload.categoryId)

  if (!category) {
    throw new ApplicationError("Billing category could not be found.", { categoryId: parsedPayload.categoryId }, 404)
  }

  if (category.deletedAt) {
    throw new ApplicationError("Billing category is deleted and cannot be used for voucher types.", { categoryId: parsedPayload.categoryId }, 409)
  }

  const ledger = ledgers.find((entry) => entry.id === parsedPayload.ledgerId)

  if (!ledger) {
    throw new ApplicationError("Billing ledger could not be found.", { ledgerId: parsedPayload.ledgerId }, 404)
  }

  if (ledger.categoryId !== category.id) {
    throw new ApplicationError(
      "Voucher type ledger must belong to the selected billing category.",
      { categoryId: category.id, ledgerId: ledger.id },
      400
    )
  }

  const postingType =
    resolvePostingTypeFromVoucherGroupName(group.name) ?? existing.postingType

  const item = storedBillingVoucherTypeSchema.parse({
    id: existing.id,
    name: parsedPayload.name,
    categoryId: category.id,
    categoryName: category.name,
    ledgerId: ledger.id,
    ledgerName: ledger.name,
    voucherGroupId: group.id,
    voucherGroupName: group.name,
    postingType,
    description: parsedPayload.description,
    deletedAt: existing.deletedAt,
  })

  await replaceStorePayloads(
    database,
    billingTableNames.voucherTypes,
    types.map((type) => ({
      id: type.id,
      moduleKey: "billing/voucher-types",
      payload: type.id === voucherTypeId ? item : type,
    }))
  )

  return billingVoucherMasterTypeResponseSchema.parse({ item })
}

export async function deleteBillingVoucherType(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherTypeId: string
) {
  assertBillingViewer(user)

  const types = await readVoucherTypes(database)
  const existing = types.find((type) => type.id === voucherTypeId)

  if (!existing) {
    throw new ApplicationError("Billing voucher type could not be found.", { voucherTypeId }, 404)
  }

  if (existing.deletedAt) {
    return { deleted: true as const, id: voucherTypeId }
  }

  const deletedAt = new Date().toISOString()

  await replaceStorePayloads(
    database,
    billingTableNames.voucherTypes,
    types.map((type) => ({
      id: type.id,
      moduleKey: "billing/voucher-types",
      payload: type.id === voucherTypeId ? { ...type, deletedAt } : type,
    }))
  )

  return { deleted: true as const, id: voucherTypeId }
}

export async function restoreBillingVoucherType(
  database: Kysely<unknown>,
  user: AuthUser,
  voucherTypeId: string
) {
  assertBillingViewer(user)

  const types = await readVoucherTypes(database)
  const existing = types.find((type) => type.id === voucherTypeId)

  if (!existing) {
    throw new ApplicationError("Billing voucher type could not be found.", { voucherTypeId }, 404)
  }

  await replaceStorePayloads(
    database,
    billingTableNames.voucherTypes,
    types.map((type) => ({
      id: type.id,
      moduleKey: "billing/voucher-types",
      payload: type.id === voucherTypeId ? { ...type, deletedAt: null } : type,
    }))
  )

  return billingVoucherMasterTypeResponseSchema.parse({
    item: {
      ...existing,
      deletedAt: null,
    },
  })
}
