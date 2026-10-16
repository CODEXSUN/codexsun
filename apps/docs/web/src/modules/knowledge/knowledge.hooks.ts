import { useQuery } from "@tanstack/react-query";
import type { KnowledgeGateway } from "./knowledge.types";
export const knowledgeKey = ["docs", "knowledge"] as const;
export function useKnowledgeCatalog(gateway: KnowledgeGateway, enabled = true) {
  return useQuery({
    queryKey: [...knowledgeKey, "catalog"],
    queryFn: gateway.catalog,
    enabled,
    retry: false
  });
}
export function useKnowledgePage(gateway: KnowledgeGateway, uuid: string | undefined) {
  return useQuery({
    queryKey: [...knowledgeKey, "page", uuid],
    queryFn: () => gateway.page(uuid!),
    enabled: !!uuid,
    retry: false
  });
}
