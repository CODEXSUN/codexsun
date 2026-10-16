import { useQuery } from "@tanstack/react-query";
import { listProductVariants, listVariantProducts } from "./product-variant.services";
import type { VariantStatus } from "./product-variant.types";
export const productVariantQueryKey = ["ecommerce", "catalog", "variants"] as const;
export function useProductVariants(search: string, status?: VariantStatus) {
  return useQuery({
    queryKey: [...productVariantQueryKey, search, status],
    queryFn: () => listProductVariants(search, status)
  });
}
export function useVariantProducts() {
  return useQuery({
    queryKey: [...productVariantQueryKey, "products"],
    queryFn: listVariantProducts,
    staleTime: 300_000
  });
}
