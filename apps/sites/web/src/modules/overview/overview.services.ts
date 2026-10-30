import type { SitesOverview } from "./overview.types";

export type SitesOverviewGateway = {
  get: () => Promise<SitesOverview>;
};

export type SitesOverviewRequest = <T>(path: string) => Promise<T>;

export function createSitesOverviewGateway(request: SitesOverviewRequest): SitesOverviewGateway {
  return {
    get: () => request<SitesOverview>("/sites/overview")
  };
}
