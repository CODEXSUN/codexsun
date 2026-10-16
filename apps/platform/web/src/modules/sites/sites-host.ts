import { createSitesOverviewGateway } from "@codexsun/sites-web/modules/overview/gateway";
import { createSiteGateway } from "@codexsun/sites-web/modules/site/index";
import { apiDelete, apiGet, apiPost, apiPut } from "../../shared/api/platform-api";

export const sitesOverviewGateway = createSitesOverviewGateway(<T>(path: string) =>
  apiGet<T>(path, "tenant")
);

export const siteGateway = createSiteGateway({
  delete: <T>(path: string) => apiDelete<T>(path, "tenant"),
  get: <T>(path: string) => apiGet<T>(path, "tenant"),
  post: <T>(path: string, body?: unknown) => apiPost<T>(path, body, "tenant"),
  put: <T>(path: string, body?: unknown) => apiPut<T>(path, body, "tenant")
});
