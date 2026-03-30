import type { Kysely } from "kysely"

import {
  getFirstJsonStorePayload,
  listJsonStorePayloads,
} from "../../../framework/src/runtime/database/process/json-store.js"
import {
  productSchema,
  productListResponseSchema,
  storefrontCatalogResponseSchema,
  type Product,
  type ProductListResponse,
  type StorefrontCatalogResponse,
} from "../../shared/index.js"

import { ecommerceTableNames } from "../../database/table-names.js"

export async function listProducts(
  database: Kysely<unknown>
): Promise<ProductListResponse> {
  const items = await listJsonStorePayloads<Product>(
    database,
    ecommerceTableNames.products
  )

  return productListResponseSchema.parse({
    items: items.map((product) => productSchema.parse(product)),
  })
}

export async function getStorefrontCatalog(
  database: Kysely<unknown>
): Promise<StorefrontCatalogResponse> {
  const catalog = await getFirstJsonStorePayload<StorefrontCatalogResponse>(
    database,
    ecommerceTableNames.storefrontCatalogs
  )

  if (!catalog) {
    throw new Error("Ecommerce storefront catalog has not been seeded yet.")
  }

  return storefrontCatalogResponseSchema.parse(catalog)
}
