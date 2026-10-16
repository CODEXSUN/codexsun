import type { DocsOverview } from "./overview.types";

export type DocsOverviewGateway = {
  get: () => Promise<DocsOverview>;
};

export type DocsOverviewRequest = <T>(path: string) => Promise<T>;

export function createDocsOverviewGateway(request: DocsOverviewRequest): DocsOverviewGateway {
  return {
    get: () => request<DocsOverview>("/docs/overview")
  };
}
