import { useQuery } from "@tanstack/react-query";
import { useMarketingTransport } from "../../transport";
import { listConnections } from "./connection.services";
export function useConnections(search: string, page: number, status = "all") {
  const api = useMarketingTransport();
  return useQuery({
    queryKey: ["marketing", api.scopeKey, "connection", search, page, status],
    queryFn: () => listConnections(api, search, page * 50, status)
  });
}
