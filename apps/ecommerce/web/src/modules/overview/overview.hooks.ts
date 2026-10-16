import { useQuery } from "@tanstack/react-query";
import type { EcommerceOverviewGateway } from "./overview.services";

export const ecommerceOverviewQueryKey = ["ecommerce", "overview"] as const;

export const useEcommerceOverview = (gateway: EcommerceOverviewGateway) =>
  useQuery({ queryKey: ecommerceOverviewQueryKey, queryFn: gateway.get });
