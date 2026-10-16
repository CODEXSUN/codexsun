import type { HimsxOverview } from "./overview.types";

export type HimsxOverviewGateway = {
  get: () => Promise<HimsxOverview>;
};

export type HimsxOverviewRequest = <T>(path: string) => Promise<T>;

export function createHimsxOverviewGateway(request: HimsxOverviewRequest): HimsxOverviewGateway {
  return {
    get: () => request<HimsxOverview>("/himsx/overview")
  };
}
