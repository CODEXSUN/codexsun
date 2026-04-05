import { randomUUID } from "node:crypto"

import type { Kysely } from "kysely"

import {
  billingCategoryListResponseSchema,
  billingCategoryResponseSchema,
  billingCategorySchema,
  billingCategoryUpsertPayloadSchema,
  billingLedgerSchema,
} from "../../shared/index.js"
import type { AuthUser } from "../../../cxapp/shared/index.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

import { billingTableNames } from "../../database/table-names.js"

import { assertBillingViewer } from "./access.js"
import { listStorePayloads, replaceStorePayloads } from "./store.js"

type StoredBillingCategory = {
  deletedAt: string | null
  description: string
  id: string
  name: string
  nature: "asset" | "liability" | "income" | "expense" | null
}

const storedBillingCategorySchema = billingCategorySchema
  .pick({
    deletedAt: true,
    description: true,
    id: true,
    name: true,
    nature: true,
  })

async function readCategories(database: Kysely<unknown>) {
  return listStorePayloads(
    database,
    billingTableNames.categories,
    storedBillingCategorySchema
  )
}

async function readLedgers(database: Kysely<unknown>) {
  return listStorePayloads(database, billingTableNames.ledgers, billingLedgerSchema)
}

function toCategoriesWithCounts(
  categories: StoredBillingCategory[],
  ledgers: Awaited<ReturnType<typeof readLedgers>>
) {
  return categories.map((category) =>
    billingCategorySchema.parse({
      ...category,
      linkedLedgerCount: ledgers.filter((ledger) => ledger.categoryId === category.id).length,
    })
  )
}

export async function listBillingCategories(database: Kysely<unknown>) {
  const [categories, ledgers] = await Promise.all([
    readCategories(database),
    readLedgers(database),
  ])

  return billingCategoryListResponseSchema.parse({
    items: toCategoriesWithCounts(categories, ledgers),
  })
}

export async function createBillingCategory(
  database: Kysely<unknown>,
  user: AuthUser,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingCategoryUpsertPayloadSchema.parse(payload)
  const categories = await readCategories(database)
  const duplicate = categories.find(
    (category) =>
      category.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError(
      "Billing category name already exists.",
      { name: parsedPayload.name },
      409
    )
  }

  const item = storedBillingCategorySchema.parse({
    id: `billing-category:${randomUUID()}`,
    name: parsedPayload.name,
    nature: null,
    description: parsedPayload.description,
    deletedAt: null,
  })

  await replaceStorePayloads(database, billingTableNames.categories, [
    ...categories.map((category) => ({
      id: category.id,
      moduleKey: "billing/categories",
      payload: category,
    })),
    {
      id: item.id,
      moduleKey: "billing/categories",
      payload: item,
    },
  ])

  return billingCategoryResponseSchema.parse({
    item: {
      ...item,
      linkedLedgerCount: 0,
    },
  })
}

export async function getBillingCategory(
  database: Kysely<unknown>,
  user: AuthUser,
  categoryId: string
) {
  assertBillingViewer(user)

  const [categories, ledgers] = await Promise.all([
    readCategories(database),
    readLedgers(database),
  ])
  const category = categories.find((item) => item.id === categoryId)

  if (!category) {
    throw new ApplicationError("Billing category was not found.", { categoryId }, 404)
  }

  return billingCategoryResponseSchema.parse({
    item: toCategoriesWithCounts([category], ledgers)[0],
  })
}

export async function updateBillingCategory(
  database: Kysely<unknown>,
  user: AuthUser,
  categoryId: string,
  payload: unknown
) {
  assertBillingViewer(user)

  const parsedPayload = billingCategoryUpsertPayloadSchema.parse(payload)
  const [categories, ledgers] = await Promise.all([
    readCategories(database),
    readLedgers(database),
  ])
  const existing = categories.find((item) => item.id === categoryId)

  if (!existing) {
    throw new ApplicationError("Billing category was not found.", { categoryId }, 404)
  }

  const duplicate = categories.find(
    (category) =>
      category.id !== categoryId &&
      category.name.trim().toLowerCase() === parsedPayload.name.trim().toLowerCase()
  )

  if (duplicate) {
    throw new ApplicationError(
      "Billing category name already exists.",
      { name: parsedPayload.name },
      409
    )
  }

  const linkedLedgers = ledgers.filter((ledger) => ledger.categoryId === categoryId)

  const updatedCategory = storedBillingCategorySchema.parse({
    id: existing.id,
    name: parsedPayload.name,
    nature: existing.nature,
    description: parsedPayload.description,
    deletedAt: existing.deletedAt,
  })

  await replaceStorePayloads(
    database,
    billingTableNames.categories,
    categories.map((category) => ({
      id: category.id,
      moduleKey: "billing/categories",
      payload: category.id === categoryId ? updatedCategory : category,
    }))
  )

  await replaceStorePayloads(
    database,
    billingTableNames.ledgers,
    ledgers.map((ledger) => ({
      id: ledger.id,
      moduleKey: "billing/ledgers",
      payload:
        ledger.categoryId === categoryId
          ? {
              ...ledger,
              categoryName: updatedCategory.name,
            }
          : ledger,
    }))
  )

  return billingCategoryResponseSchema.parse({
    item: {
      ...updatedCategory,
      linkedLedgerCount: linkedLedgers.length,
    },
  })
}

export async function deleteBillingCategory(
  database: Kysely<unknown>,
  user: AuthUser,
  categoryId: string
) {
  assertBillingViewer(user)

  const [categories, ledgers] = await Promise.all([
    readCategories(database),
    readLedgers(database),
  ])
  const existing = categories.find((item) => item.id === categoryId)

  if (!existing) {
    throw new ApplicationError("Billing category was not found.", { categoryId }, 404)
  }

  if (existing.deletedAt) {
    return { deleted: true as const, id: categoryId }
  }

  const deletedAt = new Date().toISOString()

  await replaceStorePayloads(
    database,
    billingTableNames.categories,
    categories.map((category) => ({
      id: category.id,
      moduleKey: "billing/categories",
      payload:
        category.id === categoryId
          ? {
              ...category,
              deletedAt,
            }
          : category,
    }))
  )

  return {
    deleted: true as const,
    id: categoryId,
  }
}

export async function restoreBillingCategory(
  database: Kysely<unknown>,
  user: AuthUser,
  categoryId: string
) {
  assertBillingViewer(user)

  const [categories, ledgers] = await Promise.all([
    readCategories(database),
    readLedgers(database),
  ])
  const existing = categories.find((item) => item.id === categoryId)

  if (!existing) {
    throw new ApplicationError("Billing category was not found.", { categoryId }, 404)
  }

  await replaceStorePayloads(
    database,
    billingTableNames.categories,
    categories.map((category) => ({
      id: category.id,
      moduleKey: "billing/categories",
      payload:
        category.id === categoryId
          ? {
              ...category,
              deletedAt: null,
            }
          : category,
    }))
  )

  return billingCategoryResponseSchema.parse({
    item: toCategoriesWithCounts(
      [
        {
          ...existing,
          deletedAt: null,
        },
      ],
      ledgers
    )[0],
  })
}
