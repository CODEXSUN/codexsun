import { useQuery } from "@tanstack/react-query";
import { listFrappePromotionItems, listPromotionCards } from "./promotion-card.services";
import type { PromotionCardStatus } from "./promotion-card.types";

export const promotionCardQueryKey = ["ecommerce", "storefront", "promotions"] as const;
export const promotionCardFrappeItemsQueryKey = [
  "ecommerce",
  "storefront",
  "promotion-frappe-items"
] as const;

export function usePromotionCards(search: string, status?: PromotionCardStatus) {
  return useQuery({
    queryFn: () => listPromotionCards(search, status),
    queryKey: [...promotionCardQueryKey, search, status]
  });
}

export function usePromotionCardFrappeItems(search: string) {
  return useQuery({
    queryFn: () => listFrappePromotionItems(search),
    queryKey: [...promotionCardFrappeItemsQueryKey, search],
    staleTime: 60_000
  });
}
