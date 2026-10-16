import { useQuery } from "@tanstack/react-query";
import {
  listCoreBrandOptions,
  listCoreProductOptions,
  listFrappeItems,
  listProductInformation
} from "./product-information.services";
import type { PublicationStatus } from "./product-information.types";
export const productInformationQueryKey = ["ecommerce", "catalog", "product-information"] as const;
export const coreProductOptionsQueryKey = ["ecommerce", "catalog", "core-product-options"] as const;
export const coreBrandOptionsQueryKey = ["ecommerce", "catalog", "core-brand-options"] as const;
export const frappeItemOptionsQueryKey = ["ecommerce", "catalog", "frappe-item-options"] as const;
export function useProductInformation(search: string, status?: PublicationStatus) {
  return useQuery({
    queryKey: [...productInformationQueryKey, search, status],
    queryFn: () => listProductInformation(search, status)
  });
}
export function useCoreProductOptions() {
  return useQuery({
    queryKey: coreProductOptionsQueryKey,
    queryFn: listCoreProductOptions,
    staleTime: 300_000
  });
}
export function useCoreBrandOptions() {
  return useQuery({
    queryKey: coreBrandOptionsQueryKey,
    queryFn: listCoreBrandOptions,
    staleTime: 300_000
  });
}
export function useFrappeItemOptions(search: string) {
  return useQuery({
    queryKey: [...frappeItemOptionsQueryKey, search],
    queryFn: () => listFrappeItems(search),
    staleTime: 60_000
  });
}
