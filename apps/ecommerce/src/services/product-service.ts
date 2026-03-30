import {
  productListResponseSchema,
  storefrontCatalogResponseSchema,
  type ProductListResponse,
  type StorefrontCatalogResponse,
} from "../../shared/index.js"

import { products, storefrontCatalog } from "../data/ecommerce-seed.js"

export function listProducts(): ProductListResponse {
  return productListResponseSchema.parse({
    items: products,
  })
}

export function getStorefrontCatalog(): StorefrontCatalogResponse {
  return storefrontCatalogResponseSchema.parse(storefrontCatalog)
}
