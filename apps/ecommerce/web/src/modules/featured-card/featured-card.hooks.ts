import { useQuery } from "@tanstack/react-query";
import { listFrappeFeaturedItems, listFeaturedCards } from "./featured-card.services";
import type { FeaturedCardStatus } from "./featured-card.types";

export const featuredCardQueryKey = ["ecommerce", "storefront", "featuredCards"] as const;
export const featuredCardFrappeItemsQueryKey = [
  "ecommerce",
  "storefront",
  "featured-frappe-items"
] as const;

export function useFeaturedCards(search: string, status?: FeaturedCardStatus) {
  return useQuery({
    queryFn: () => listFeaturedCards(search, status),
    queryKey: [...featuredCardQueryKey, search, status]
  });
}

export function useFeaturedCardFrappeItems(search: string) {
  return useQuery({
    queryFn: () => listFrappeFeaturedItems(search),
    queryKey: [...featuredCardFrappeItemsQueryKey, search],
    staleTime: 60_000
  });
}
