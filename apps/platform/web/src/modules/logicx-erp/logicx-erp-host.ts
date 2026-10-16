import { createLogicxErpOverviewGateway } from "@codexsun/logicx-erp-web/modules/overview/gateway";
import { createLogicxErpSchemeGateway } from "@codexsun/logicx-erp-web/modules/scheme/gateway";
import { apiDelete, apiGet, apiPost, apiPut } from "../../shared/api/platform-api";

export const logicxErpOverviewGateway = createLogicxErpOverviewGateway((path) =>
  apiGet(path, "tenant")
);

export const logicxErpSchemeGateway = createLogicxErpSchemeGateway((path, options) => {
  if (options?.method === "POST") return apiPost(path, options.body, "tenant");
  if (options?.method === "PUT") return apiPut(path, options.body, "tenant");
  if (options?.method === "DELETE") return apiDelete(path, "tenant");
  return apiGet(path, "tenant");
});
