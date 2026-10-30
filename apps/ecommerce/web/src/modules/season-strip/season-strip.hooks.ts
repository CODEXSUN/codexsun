import { useQuery } from "@tanstack/react-query";
import { listFrappeSeasonItems, listSeasonStrips } from "./season-strip.services";
import type { SeasonStripStatus } from "./season-strip.types";

export const seasonStripQueryKey = ["ecommerce", "storefront", "seasons"] as const;
export const seasonStripFrappeItemsQueryKey = [
  "ecommerce",
  "storefront",
  "season-frappe-items"
] as const;

export function useSeasonStrips(search: string, status?: SeasonStripStatus) {
  return useQuery({
    queryFn: () => listSeasonStrips(search, status),
    queryKey: [...seasonStripQueryKey, search, status]
  });
}

export function useSeasonStripFrappeItems(search: string) {
  return useQuery({
    queryFn: () => listFrappeSeasonItems(search),
    queryKey: [...seasonStripFrappeItemsQueryKey, search],
    staleTime: 60_000
  });
}
