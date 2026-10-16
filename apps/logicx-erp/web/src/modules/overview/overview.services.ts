import type { LogicxErpOverview } from "./overview.types";

export type LogicxErpOverviewGateway = {
  get: () => Promise<LogicxErpOverview>;
};

export type LogicxErpOverviewRequest = <T>(path: string) => Promise<T>;

export function createLogicxErpOverviewGateway(
  request: LogicxErpOverviewRequest
): LogicxErpOverviewGateway {
  return {
    get: () => request<LogicxErpOverview>("/logicx-erp/overview")
  };
}
