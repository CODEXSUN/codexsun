import { useQuery } from "@tanstack/react-query";
import type { DocsOverviewGateway } from "./overview.services";

export const docsOverviewQueryKey = ["docs", "overview"] as const;

export const useDocsOverview = (gateway: DocsOverviewGateway) =>
  useQuery({ queryKey: docsOverviewQueryKey, queryFn: gateway.get });
