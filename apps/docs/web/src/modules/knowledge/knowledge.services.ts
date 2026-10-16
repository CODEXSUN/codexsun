import type { KnowledgeGateway, KnowledgeCatalog, KnowledgePage } from "./knowledge.types";
export function createKnowledgeGateway(
  request: <T>(path: string, method?: "GET" | "PUT", body?: unknown) => Promise<T>
): KnowledgeGateway {
  return {
    catalog: () => request<KnowledgeCatalog>("/docs/knowledge"),
    page: (uuid) => request<KnowledgePage>(`/docs/knowledge/${encodeURIComponent(uuid)}`),
    save: (uuid, input) =>
      request<KnowledgePage>(`/docs/knowledge/${encodeURIComponent(uuid)}`, "PUT", input)
  };
}
