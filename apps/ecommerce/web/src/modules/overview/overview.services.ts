import type { EcommerceOverview } from "./overview.types";

export type EcommerceOverviewGateway = {
  get: () => Promise<EcommerceOverview>;
};

export type EcommerceOverviewRequest = <T>(path: string) => Promise<T>;

export function createEcommerceOverviewGateway(
  request: EcommerceOverviewRequest
): EcommerceOverviewGateway {
  return {
    get: () => request<EcommerceOverview>("/ecommerce/overview")
  };
}
