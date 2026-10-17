import { publicRequest } from "../../transport";
import type { Product } from "./product.types";
export const publicProducts = (companyUuid: string) =>
  publicRequest<Product[]>(
    `/public/tconnect/product?companyUuid=${encodeURIComponent(companyUuid)}`
  );
