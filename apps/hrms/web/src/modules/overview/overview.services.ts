import type { HrmsOverview } from "./overview.types";

export type HrmsOverviewGateway = {
  get: () => Promise<HrmsOverview>;
};

export type HrmsOverviewRequest = <T>(path: string) => Promise<T>;

export function createHrmsOverviewGateway(request: HrmsOverviewRequest): HrmsOverviewGateway {
  return {
    get: () => request<HrmsOverview>("/hrms/overview")
  };
}
