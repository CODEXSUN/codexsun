import { useQuery } from "@tanstack/react-query";
import {
  getSliderStorageSettings,
  listFrappeSliderItems,
  listStorefrontSliders
} from "./storefront-slider.services";
import type { StorefrontSliderStatus } from "./storefront-slider.types";

export const storefrontSliderQueryKey = ["ecommerce", "storefront", "sliders"] as const;
export const storefrontSliderFrappeItemsQueryKey = [
  "ecommerce",
  "storefront",
  "slider-frappe-items"
] as const;

export function useStorefrontSliders(search: string, status?: StorefrontSliderStatus) {
  return useQuery({
    queryFn: () => listStorefrontSliders(search, status),
    queryKey: [...storefrontSliderQueryKey, search, status]
  });
}

export function useStorefrontSliderFrappeItems(search: string) {
  return useQuery({
    queryFn: () => listFrappeSliderItems(search),
    queryKey: [...storefrontSliderFrappeItemsQueryKey, search],
    staleTime: 60_000
  });
}

export function useStorefrontSliderStorageSettings() {
  return useQuery({
    queryFn: getSliderStorageSettings,
    queryKey: [...storefrontSliderQueryKey, "storage"],
    staleTime: 300_000
  });
}
