import { products as ecommerceSeedProducts } from "../../../ecommerce/src/data/ecommerce-seed.js"
import { productSchema, type Product } from "../../shared/index.js"

export const products: Product[] = ecommerceSeedProducts.map((product) =>
  productSchema.parse({
    ...product,
    code:
      typeof (product as { code?: unknown }).code === "string" &&
      (product as { code?: string }).code.trim()
        ? (product as { code: string }).code
        : product.sku,
  })
)
