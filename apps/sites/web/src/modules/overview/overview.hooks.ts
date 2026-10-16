import { useQuery } from "@tanstack/react-query";
import type { SitesOverviewGateway } from "./overview.services";

export const sitesOverviewQueryKey = ["sites", "overview"] as const;

export const useSitesOverview = (gateway: SitesOverviewGateway) =>
  useQuery({ queryKey: sitesOverviewQueryKey, queryFn: gateway.get });
