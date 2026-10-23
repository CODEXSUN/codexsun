import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listConsents, countConsents } from "./consent.services";
export function useConsents(search: string, action: string, page: number) {
  const api = useMarketingTransport();
  const list = useQuery({
    queryKey: ["marketing", api.scopeKey, "consent", search, action, page],
    queryFn: () => listConsents(api, search, action, page)
  });
  const count = useQuery({
    queryKey: ["marketing", api.scopeKey, "consent-count", search, action],
    queryFn: () => countConsents(api, search, action)
  });
  return { list, count };
}
