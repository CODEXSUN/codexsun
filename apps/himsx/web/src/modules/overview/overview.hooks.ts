import { useQuery } from "@tanstack/react-query";
import type { HimsxOverviewGateway } from "./overview.services";

export const himsxOverviewQueryKey = ["himsx", "overview"] as const;

export const useHimsxOverview = (gateway: HimsxOverviewGateway) =>
  useQuery({ queryKey: himsxOverviewQueryKey, queryFn: gateway.get });
