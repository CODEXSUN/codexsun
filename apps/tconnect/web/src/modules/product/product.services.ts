import { publicRequest } from "../../transport";
import type { Product, PublicCatalogProduct } from "./product.types";
export const publicProducts = (companyUuid: string) =>
  publicRequest<Product[]>(
    `/public/tconnect/product?companyUuid=${encodeURIComponent(companyUuid)}`
  );

export const searchPublicProducts = (q = "") =>
  publicRequest<PublicCatalogProduct[]>(
    `/public/tconnect/product/search?q=${encodeURIComponent(q)}`
  );
