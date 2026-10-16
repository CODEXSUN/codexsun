import { createDocsOverviewGateway } from "@codexsun/docs-web/modules/overview/gateway";
import { apiGet, apiPut } from "../../shared/api/platform-api";
export const docsOverviewGateway = createDocsOverviewGateway(<T>(path: string) =>
  apiGet<T>(path, "tenant")
);

import { createKnowledgeGateway } from "@codexsun/docs-web/modules/knowledge";
export const docsKnowledgeGateway = createKnowledgeGateway(
  <T>(path: string, method = "GET", body?: unknown) =>
    method === "PUT" ? apiPut<T>(path, body, "tenant") : apiGet<T>(path, "tenant")
);
