import { useQuery } from "@tanstack/react-query";
import type { LogicxErpOverviewGateway } from "./overview.services";

export const logicxErpOverviewQueryKey = ["logicx-erp", "overview"] as const;

export const useLogicxErpOverview = (gateway: LogicxErpOverviewGateway) =>
  useQuery({ queryKey: logicxErpOverviewQueryKey, queryFn: gateway.get });
