import { useQuery } from "@tanstack/react-query";
import type { HrmsOverviewGateway } from "./overview.services";

export const hrmsOverviewQueryKey = ["hrms", "overview"] as const;

export const useHrmsOverview = (gateway: HrmsOverviewGateway) =>
  useQuery({ queryKey: hrmsOverviewQueryKey, queryFn: gateway.get });
