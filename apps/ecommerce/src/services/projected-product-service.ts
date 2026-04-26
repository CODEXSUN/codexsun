import type { Kysely } from "kysely"

import { coreTableNames } from "../../../core/database/table-names.js"
import { productSchema, type Product } from "../../../core/shared/index.js"
import { listJsonStorePayloads } from "../../../framework/src/runtime/database/process/json-store.js"
import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js"

export async function readProjectedStorefrontProducts(database: Kysely<unknown>) {
  const items = await listJsonStorePayloads<Product>(database, coreTableNames.products)

  return items.map((item) =>
    productSchema.parse({
      ...item,
      attributeCount:
        typeof (item as { attributeCount?: unknown }).attributeCount === "number"
          ? (item as { attributeCount: number }).attributeCount
          : Array.isArray((item as { attributes?: unknown }).attributes)
            ? ((item as { attributes: unknown[] }).attributes?.length ?? 0)
            : 0,
      totalStockQuantity: 0,
    })
  )
}

export async function getProjectedStorefrontProduct(
  database: Kysely<unknown>,
  query: { id?: string | null; slug?: string | null }
) {
  const products = await readProjectedStorefrontProducts(database)
  const product = products.find(
    (item) =>
      item.isActive &&
      ((query.id && item.id === query.id) || (query.slug && item.slug === query.slug))
  )

  if (!product) {
    throw new ApplicationError("Projected storefront product could not be found.", query, 404)
  }

  return product
}
