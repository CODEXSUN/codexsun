import { useQuery } from "@tanstack/react-query";
import { listImageProducts, listImageVariants, listProductImages } from "./product-image.services";
import type { ImageStatus } from "./product-image.types";
export const productImageQueryKey = ["ecommerce", "catalog", "images"] as const;
export function useProductImages(search: string, status?: ImageStatus) {
  return useQuery({
    queryKey: [...productImageQueryKey, search, status],
    queryFn: () => listProductImages(search, status)
  });
}
export function useImageOptions() {
  const products = useQuery({
    queryKey: [...productImageQueryKey, "products"],
    queryFn: listImageProducts,
    staleTime: 300_000
  });
  const variants = useQuery({
    queryKey: [...productImageQueryKey, "variants"],
    queryFn: listImageVariants,
    staleTime: 300_000
  });
  return { products, variants };
}
